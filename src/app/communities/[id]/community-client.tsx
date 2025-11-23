"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../../../components/UserAvatar";

interface CommunityClientProps {
  communityId: string;
  isMember: boolean;
  userRole: string | null;
  currentUserId: string | null;
  currentUserAvatar?: string | null;
  currentUserName?: string | null;
}

export default function CommunityClient({
  communityId,
  isMember: initialIsMember,
  userRole,
  currentUserId,
  currentUserAvatar,
  currentUserName,
}: CommunityClientProps) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isLoading, setIsLoading] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleJoinLeave = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      const method = isMember ? "DELETE" : "POST";
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method,
      });

      if (res.ok) {
        setIsMember(!isMember);
        router.refresh();
      }
    } catch (error) {
      console.error("Join/Leave error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent,
          communityId: communityId,
        }),
      });

      if (res.ok) {
        setPostContent("");
        router.refresh();
      }
    } catch (error) {
      console.error("Create post error:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <div id="community-actions" className="flex gap-2 mt-4 md:mt-0">
        {isMember ? (
          <button
            onClick={handleJoinLeave}
            disabled={isLoading}
            className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-red-600 transition-colors"
          >
            {isLoading ? "..." : "Вы участник"}
          </button>
        ) : (
          <button
            onClick={handleJoinLeave}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "..." : "Вступить"}
          </button>
        )}
        {userRole === "OWNER" || userRole === "ADMIN" ? (
          <button className="btn bg-gray-100 text-gray-700">⚙️</button>
        ) : null}
      </div>

      {isMember && (
        <div className="card p-4 flex gap-4 mb-6">
          <UserAvatar
            avatar={currentUserAvatar}
            name={currentUserName || "You"}
            size={40}
          />
          <form onSubmit={handleCreatePost} className="flex-1 flex gap-2">
            <input
              type="text"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Написать на стене сообщества..."
              className="flex-1 bg-gray-50 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isPosting}
            />
            {postContent.trim() && (
              <button
                type="submit"
                disabled={isPosting}
                className="btn btn-primary py-1 px-4 rounded-full"
              >
                {isPosting ? "..." : "Send"}
              </button>
            )}
          </form>
        </div>
      )}
    </>
  );
}
