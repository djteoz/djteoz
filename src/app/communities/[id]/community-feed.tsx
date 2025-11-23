"use client";

import { useState, useEffect } from "react";
import { Post } from "../../../components/Post";

interface CommunityFeedProps {
  initialPosts: any[];
  currentUserUsername: string | null;
  userRole: string | null;
}

export default function CommunityFeed({
  initialPosts,
  currentUserUsername,
  userRole,
}: CommunityFeedProps) {
  const [posts, setPosts] = useState(initialPosts);

  // Update posts when initialPosts changes (e.g. after router.refresh())
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот пост?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUserUsername) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(currentUserUsername);

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked
              ? p.likes.filter((u: string) => u !== currentUserUsername)
              : [...p.likes, currentUserUsername],
          };
        }
        return p;
      })
    );

    try {
      await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isLiked ? "unlike" : "like" }),
      });
    } catch (error) {
      // Revert
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likes: isLiked
                ? [...p.likes, currentUserUsername]
                : p.likes.filter((u: string) => u !== currentUserUsername),
            };
          }
          return p;
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Post
          key={post.id}
          id={post.id}
          username={post.author.username}
          avatar={post.author.avatar || undefined}
          content={post.content}
          image_url={post.image || undefined}
          likes={post.likes.length}
          comments={post._count.comments}
          created_at={post.createdAt}
          commentsList={post.comments.map((c: any) => ({
            id: c.id,
            text: c.content,
            author: c.author.username,
            authorAvatar: c.author.avatar || undefined,
            createdAt: c.createdAt,
          }))}
          currentUser={currentUserUsername || undefined}
          isLiked={
            currentUserUsername
              ? post.likes.includes(currentUserUsername)
              : false
          }
          isOwner={currentUserUsername === post.author.username}
          canDelete={["OWNER", "ADMIN", "MODERATOR"].includes(userRole || "")}
          onDelete={() => handleDelete(post.id)}
          onLike={() => handleLike(post.id)}
        />
      ))}

      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          На стене пока нет записей
        </div>
      )}
    </div>
  );
}
