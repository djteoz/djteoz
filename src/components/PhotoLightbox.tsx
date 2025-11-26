"use client";
import React, { useState, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";

interface Comment {
  id: string;
  content: string;
  author: {
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: string;
}

interface PhotoDetails {
  id: string;
  url: string;
  description?: string;
  uploader: {
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  album?: {
    id: string;
    title: string;
  };
  comments: Comment[];
  likes: string[];
  isLiked: boolean;
  likesCount: number;
  createdAt: string;
}

interface PhotoLightboxProps {
  photoId: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function PhotoLightbox({
  photoId,
  onClose,
  onNext,
  onPrev,
}: PhotoLightboxProps) {
  const [photo, setPhoto] = useState<PhotoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPhotoDetails();
  }, [photoId]);

  const fetchPhotoDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/photos/${photoId}`);
      if (res.ok) {
        const data = await res.json();
        setPhoto(data);
      }
    } catch (error) {
      console.error("Failed to fetch photo details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!photo) return;

    // Optimistic update
    const newIsLiked = !photo.isLiked;
    const newLikesCount = newIsLiked
      ? photo.likesCount + 1
      : photo.likesCount - 1;

    setPhoto((prev) =>
      prev
        ? {
            ...prev,
            isLiked: newIsLiked,
            likesCount: newLikesCount,
          }
        : null
    );

    try {
      await fetch(`/api/photos/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newIsLiked ? "like" : "unlike" }),
      });
    } catch (error) {
      console.error("Failed to like photo", error);
      // Revert on error
      fetchPhotoDetails();
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setPhoto((prev) =>
          prev
            ? {
                ...prev,
                comments: [...prev.comments, newComment],
              }
            : null
        );
        setCommentText("");
      }
    } catch (error) {
      console.error("Failed to add comment", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!photo) return null;

  const fullName =
    [photo.uploader.firstName, photo.uploader.lastName]
      .filter(Boolean)
      .join(" ") || photo.uploader.username;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-50 p-2"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Navigation */}
      {onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-40 p-4"
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-40 p-4"
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      <div className="flex w-full h-full">
        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center relative p-4 md:p-10">
          <img
            src={photo.url}
            alt={photo.description || "Photo"}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Sidebar (Info & Comments) */}
        <div className="w-[360px] bg-white h-full flex flex-col border-l border-gray-800 hidden lg:flex">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <UserAvatar
              avatar={photo.uploader.avatar}
              name={fullName}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 truncate">{fullName}</div>
              <div className="text-xs text-gray-500">
                {new Date(photo.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Description & Stats */}
          <div className="p-4 border-b border-gray-100">
            {photo.description && (
              <p className="text-gray-800 mb-3">{photo.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${
                  photo.isLiked
                    ? "text-red-500 font-medium"
                    : "hover:text-red-500"
                }`}
              >
                <svg
                  className={`w-5 h-5 ${photo.isLiked ? "fill-current" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {photo.likesCount}
              </button>
              {photo.album && (
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                  📁 {photo.album.title}
                </span>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {photo.comments.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Нет комментариев
              </div>
            ) : (
              photo.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <UserAvatar
                    avatar={comment.author.avatar}
                    name={comment.author.firstName || comment.author.username}
                    size={32}
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="font-medium text-sm text-gray-900">
                        {comment.author.firstName || comment.author.username}
                      </div>
                      <div className="text-sm text-gray-800">
                        {comment.content}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 ml-1">
                      {new Date(comment.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Написать комментарий..."
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submittingComment}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm px-2 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
