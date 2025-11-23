"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";

export type Comment = {
  id: string;
  author: string;
  authorName?: string;
  authorAvatar?: string;
  text: string;
  likes?: string[];
  createdAt: string;
};

export type PostProps = {
  id: string;
  username: string;
  avatar?: string;
  content: string;
  image_url?: string;
  created_at: string;
  likes: number;
  views?: number;
  comments: number;
  commentsList?: Comment[];
  isLiked?: boolean;
  isOwner?: boolean;
  canDelete?: boolean;
  isFriend?: boolean;
  currentUser?: string;
  onLike?: () => void;
  onComment?: (text: string) => void;
  onShare?: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  onLikeComment?: (commentId: string, isLiked: boolean) => void;
  onDeleteComment?: (commentId: string) => void;
};

export const Post: React.FC<PostProps> = ({
  id,
  username,
  avatar,
  content = "",
  image_url,
  created_at,
  likes,
  views = 0,
  comments,
  commentsList = [],
  isLiked = false,
  isOwner = false,
  canDelete = false,
  isFriend = false,
  currentUser,
  onLike,
  onComment,
  onShare,
  onDelete,
  onEdit,
  onLikeComment,
  onDeleteComment,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasViewed(true);
          fetch(`/api/posts/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "view" }),
          }).catch(console.error);
        }
      },
      { threshold: 0.5 }
    );

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => observer.disconnect();
  }, [id, hasViewed]);

  const avatarSrc = avatar
    ? avatar.startsWith("data:")
      ? avatar
      : `/uploads/${avatar}`
    : "/default-avatar.png";

  const isLongContent = content.length > 300;
  const displayContent =
    isExpanded || !isLongContent ? content : content.slice(0, 300) + "...";

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onComment) return;

    setIsSubmitting(true);
    try {
      await onComment(commentText);
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== content) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div
      ref={postRef}
      className="card p-0 mb-6 hover:shadow-lg transition-shadow duration-300 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${username}`}>
              <UserAvatar
                avatar={avatar}
                name={username}
                size={40}
                className="border border-gray-100"
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${username}`}
                  className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {username}
                </Link>
                {isFriend && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded tracking-wide">
                    Друг
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 group/time relative cursor-help">
                {new Date(created_at).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <div className="absolute left-0 top-full mt-1 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/time:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                  {new Date(created_at).toISOString()}
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              •••
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10 animate-fade-in">
                {isOwner && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditContent(content);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>✏️</span> Редактировать
                  </button>
                )}
                {(isOwner || canDelete) && (
                  <button
                    onClick={() => {
                      onDelete?.();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <span>🗑️</span> Удалить
                  </button>
                )}
                {!isOwner && (
                  <>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <span>🔖</span> Сохранить
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <span>⚠️</span> Пожаловаться
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <span>👁️‍🗨️</span> Скрыть
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Сохранить
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {displayContent}
              </p>
              {isLongContent && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-indigo-600 text-sm font-medium hover:underline mt-1"
                >
                  {isExpanded ? "Свернуть" : "Показать полностью..."}
                </button>
              )}
            </>
          )}
          {image_url && (
            <div className="mt-3 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <img
                src={image_url}
                alt="Post content"
                className="w-full h-auto object-cover max-h-[600px]"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <button
              onClick={onLike}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors group ${
                isLiked
                  ? "text-pink-600 bg-pink-50"
                  : "text-gray-500 hover:bg-gray-50 hover:text-pink-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span className="font-medium text-sm">{likes}</span>
            </button>

            <button
              onClick={toggleComments}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors group ${
                showComments
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:bg-gray-50 hover:text-indigo-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span className="font-medium text-sm">{comments}</span>
            </button>

            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-colors group"
            >
              <span className="text-lg leading-none">↪️</span>
            </button>
          </div>

          <div
            className="flex items-center gap-1 text-gray-400 text-xs"
            title="Просмотры"
          >
            <span>👁️</span>
            <span>{views}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-gray-50 border-t border-gray-100 p-4 animate-fade-in">
          {/* Comments List */}
          <div className="space-y-4 mb-4">
            {commentsList.length > 0 ? (
              commentsList.map((comment) => {
                const isCommentLiked =
                  currentUser && comment.likes?.includes(currentUser);
                const isCommentOwner =
                  currentUser && comment.author === currentUser;
                const isPostOwner = currentUser && username === currentUser;

                return (
                  <div key={comment.id} className="flex gap-3 group/comment">
                    <Link href={`/profile/${comment.author}`}>
                      <UserAvatar
                        avatar={comment.authorAvatar}
                        name={comment.authorName || comment.author}
                        size={32}
                        className="border border-gray-200"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 relative">
                        <div className="flex justify-between items-baseline mb-1">
                          <Link
                            href={`/profile/${comment.author}`}
                            className="font-bold text-sm text-gray-900 hover:text-indigo-600"
                          >
                            {comment.authorName || comment.author}
                          </Link>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleString(
                              "ru-RU",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                        {/* Comment Actions */}
                        <div className="absolute right-2 bottom-1 flex gap-2">
                          <button
                            onClick={() =>
                              onLikeComment &&
                              onLikeComment(comment.id, !!isCommentLiked)
                            }
                            className={`text-xs flex items-center gap-1 ${
                              isCommentLiked
                                ? "text-pink-600"
                                : "text-gray-400 hover:text-pink-500"
                            }`}
                          >
                            ♥ {comment.likes?.length || 0}
                          </button>
                        </div>
                      </div>
                      {(isCommentOwner || isPostOwner) && (
                        <button
                          onClick={() =>
                            onDeleteComment && onDeleteComment(comment.id)
                          }
                          className="text-xs text-red-400 hover:text-red-600 mt-1 ml-2 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 text-sm py-2">
                Нет комментариев. Будьте первым!
              </div>
            )}
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="flex gap-3 items-start"
          >
            <div className="flex-shrink-0">
              <UserAvatar
                avatar={currentUser} // Note: currentUser prop is just username string in PostProps, not avatar.
                // Wait, PostProps has currentUser?: string. It doesn't have currentUserAvatar.
                // The original code had a placeholder div.
                // Let's keep a placeholder or try to use initials if currentUser is passed.
                name={currentUser || "?"}
                size={32}
                className="bg-indigo-100 text-indigo-500"
              />
            </div>
            <div className="flex-1 relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Написать комментарий..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all resize-none outline-none min-h-[40px]"
                rows={commentText ? 2 : 1}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className={`absolute right-2 bottom-2 p-1 rounded-full transition-colors ${
                  commentText.trim()
                    ? "text-indigo-600 hover:bg-indigo-50"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
