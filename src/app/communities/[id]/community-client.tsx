"use client";

import { useState, useRef } from "react";
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
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File) => {
    const signRes = await fetch("/api/cloudinary-sign", { method: "POST" });
    if (!signRes.ok) throw new Error("Failed to get signature");
    const { timestamp, folder, signature, api_key, cloud_name } =
      await signRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", api_key);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
    const data = await uploadRes.json();
    return data.secure_url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsPosting(true);
      const url = await uploadToCloudinary(file);
      setPostImage(url);
    } catch (e) {
      console.error(e);
      alert("Ошибка загрузки изображения");
    } finally {
      setIsPosting(false);
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsPosting(true);
      const url = await uploadToCloudinary(file);
      setPostContent((prev) => `${prev}\n🎵 ${file.name}: ${url}`);
    } catch (e) {
      console.error(e);
      alert("Ошибка загрузки музыки");
    } finally {
      setIsPosting(false);
    }
  };

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
    if (!postContent.trim() && !postImage) return;

    setIsPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent,
          image: postImage,
          communityId: communityId,
        }),
      });

      if (res.ok) {
        setPostContent("");
        setPostImage(null);
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
          <button
            onClick={() => router.push(`/communities/${communityId}/settings`)}
            className="btn bg-gray-100 text-gray-700"
          >
            ⚙️
          </button>
        ) : null}
      </div>

      {isMember && (
        <div className="card p-4 flex gap-4 mb-6">
          <UserAvatar
            avatar={currentUserAvatar}
            name={currentUserName || "You"}
            size={40}
          />
          <div className="flex-1">
            <form onSubmit={handleCreatePost} className="flex gap-2">
              <input
                type="text"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Написать на стене сообщества..."
                className="flex-1 bg-gray-50 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isPosting}
              />
              {(postContent.trim() || postImage) && (
                <button
                  type="submit"
                  disabled={isPosting}
                  className="btn btn-primary py-1 px-4 rounded-full"
                >
                  {isPosting ? "..." : "Send"}
                </button>
              )}
            </form>

            {postImage && (
              <div className="mt-2 relative inline-block">
                <img
                  src={postImage}
                  alt="Preview"
                  className="max-h-32 rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => setPostImage(null)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-2 mt-2 ml-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                title="Добавить фото"
              >
                📷
              </button>
              <input
                ref={imageInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />

              <button
                type="button"
                onClick={() => musicInputRef.current?.click()}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                title="Добавить музыку"
              >
                🎵
              </button>
              <input
                ref={musicInputRef}
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleMusicUpload}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
