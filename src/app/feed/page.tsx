"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Post as PostComponent } from "../../components/Post";
import { UserAvatar } from "../../components/UserAvatar";

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  author: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  image_url?: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  views: number;
  isFriend: boolean;
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'friends', 'media', 'text', 'liked'
  const [sortMode, setSortMode] = useState("recent"); // 'recent', 'interesting'
  const [stories, setStories] = useState<any[]>([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textOverlays, setTextOverlays] = useState<
    { id: number; text: string; x: number; y: number; color: string }[]
  >([]);
  const [stickers, setStickers] = useState<
    { id: number; emoji: string; x: number; y: number }[]
  >([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const bakeOverlays = async (
    file: File,
    overlays: typeof textOverlays,
    stickersList: typeof stickers
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No context"));
          return;
        }

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Draw stickers
        stickersList.forEach((sticker) => {
          const x = (sticker.x / 100) * canvas.width;
          const y = (sticker.y / 100) * canvas.height;
          ctx.font = `${canvas.width * 0.15}px serif`; // ~15% of width
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(sticker.emoji, x, y);
        });

        // Draw text
        overlays.forEach((overlay) => {
          const x = (overlay.x / 100) * canvas.width;
          const y = (overlay.y / 100) * canvas.height;
          ctx.fillStyle = overlay.color;
          ctx.font = `bold ${canvas.width * 0.08}px sans-serif`; // ~8% of width
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Add shadow for visibility
          ctx.shadowColor = "black";
          ctx.shadowBlur = canvas.width * 0.01;
          ctx.fillText(overlay.text, x, y);
          ctx.shadowBlur = 0;
        });

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], "story-edited.jpg", { type: "image/jpeg" })
              );
            } else {
              reject(new Error("Canvas to Blob failed"));
            }
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = reject;
    });
  };

  const handleCreateStory = async () => {
    if (!storyFile || uploadingStory) return;

    setUploadingStory(true);
    try {
      let fileToUpload = storyFile;

      // Bake overlays for images
      if (
        storyFile.type.startsWith("image/") &&
        (textOverlays.length > 0 || stickers.length > 0)
      ) {
        try {
          fileToUpload = await bakeOverlays(storyFile, textOverlays, stickers);
        } catch (err) {
          console.error("Failed to bake overlays:", err);
          // Fallback to original file
        }
      }

      // Upload file first
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // Create story
      // Note: In a real app, we would merge the text/stickers onto the image/video on the server or client canvas
      // For now, we just save the media.
      // TODO: Implement canvas merging or save metadata for overlays
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: url,
          type: storyFile.type.startsWith("video/") ? "video" : "image",
        }),
      });

      if (res.ok) {
        setShowStoryModal(false);
        setStoryFile(null);
        setStoryPreview(null);
        setTextOverlays([]);
        setStickers([]);
        // Refresh stories
        const storiesRes = await fetch("/api/stories");
        const storiesData = await storiesRes.json();
        setStories(storiesData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingStory(false);
    }
  };
  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.username) {
          setCurrentUser(data.username);
          setCurrentUserAvatar(data.avatar);
          setLoading(false);
        } else {
          setLoading(false);
          router.push("/login");
        }
      })
      .catch(() => {
        setLoading(false);
        router.push("/login");
      });

    // Fetch stories
    fetch("/api/stories", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStories(data);
      })
      .catch(console.error);
  }, []);

  // Загрузить посты
  const fetchPosts = useCallback(
    async (
      pageNum: number,
      search: string = "",
      filter: string = "all",
      sort: string = "recent"
    ) => {
      try {
        const queryParams = new URLSearchParams({
          page: pageNum.toString(),
          limit: "10",
          search,
          filter,
          sort,
        });

        const res = await fetch(`/api/posts?${queryParams}`, {
          credentials: "include",
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;

        const data = await res.json();
        if (pageNum === 1) {
          setPosts(data.posts || []);
        } else {
          setPosts((prev) => [...prev, ...(data.posts || [])]);
        }
        setHasMore(data.hasMore);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch and when filter/search changes
  useEffect(() => {
    setPage(1);
    setLoading(true);
    // Debounce search could be added here, but for now direct call
    const timer = setTimeout(() => {
      fetchPosts(1, searchQuery, activeFilter, sortMode);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPosts, searchQuery, activeFilter, sortMode]);

  // Бесконечная прокрутка
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((p) => {
            const nextPage = p + 1;
            fetchPosts(nextPage, searchQuery, activeFilter, sortMode);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchPosts, searchQuery, activeFilter, sortMode]);

  const handleAddText = () => {
    if (!storyText.trim()) {
      setShowTextInput(false);
      return;
    }
    setTextOverlays([
      ...textOverlays,
      {
        id: Date.now(),
        text: storyText,
        x: 50,
        y: 50,
        color: textColor,
      },
    ]);
    setStoryText("");
    setShowTextInput(false);
  };

  const handleAddSticker = (emoji: string) => {
    setStickers([
      ...stickers,
      {
        id: Date.now(),
        emoji,
        x: 50,
        y: 50,
      },
    ]);
    setShowStickerPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoryFile(file);
      setStoryPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newPostText }),
      });

      if (res.ok) {
        setNewPostText("");
        fetchPosts(1, searchQuery, activeFilter, sortMode);
      }
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !currentUser) return;

    const isLiked = post.likes.includes(currentUser);

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked
              ? p.likes.filter((u) => u !== currentUser)
              : [...p.likes, currentUser],
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: isLiked ? "unlike" : "like",
        }),
      });

      if (!res.ok) {
        // Revert if failed
        fetchPosts(page, searchQuery, activeFilter, sortMode);
      }
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Story Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#222] w-full max-w-4xl h-[80vh] rounded-xl overflow-hidden flex shadow-2xl">
            {/* Preview Area */}
            <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
              {storyPreview ? (
                <>
                  {storyFile?.type.startsWith("video/") ? (
                    <video
                      src={storyPreview}
                      className="max-h-full max-w-full"
                      controls={false}
                      autoPlay
                      loop
                      muted
                    />
                  ) : (
                    <img
                      src={storyPreview}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}

                  {/* Overlays */}
                  {textOverlays.map((overlay) => (
                    <div
                      key={overlay.id}
                      className="absolute text-2xl font-bold drop-shadow-md cursor-move select-none z-10"
                      style={{
                        left: `${overlay.x}%`,
                        top: `${overlay.y}%`,
                        color: overlay.color,
                        transform: "translate(-50%, -50%)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                      }}
                      draggable
                      onDragEnd={(e) => {
                        // Calculate new position in percentages relative to the container
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          const rect = container.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          
                          // Update overlay position
                          setTextOverlays(prev => prev.map(o => 
                            o.id === overlay.id ? { ...o, x, y } : o
                          ));
                        }
                      }}
                    >
                      {overlay.text}
                    </div>
                  ))}
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="absolute text-4xl cursor-move select-none z-10"
                      style={{
                        left: `${sticker.x}%`,
                        top: `${sticker.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      draggable
                      onDragEnd={(e) => {
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          const rect = container.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          
                          setStickers(prev => prev.map(s => 
                            s.id === sticker.id ? { ...s, x, y } : s
                          ));
                        }
                      }}
                    >
                      {sticker.emoji}
                    </div>
                  ))}

                  {/* Text Input Overlay */}
                  {showTextInput && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <div className="w-full max-w-md px-4">
                        <input
                          autoFocus
                          type="text"
                          value={storyText}
                          onChange={(e) => setStoryText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddText();
                            if (e.key === "Escape") setShowTextInput(false);
                          }}
                          placeholder="Введите текст..."
                          style={{ color: textColor, borderColor: textColor }}
                          className="w-full bg-transparent text-center text-3xl font-bold border-b-2 outline-none placeholder-white/50 pb-2"
                        />
                        
                        {/* Color Picker */}
                        <div className="flex justify-center gap-3 mt-6">
                          {[
                            "#ffffff", // White
                            "#000000", // Black
                            "#ef4444", // Red
                            "#f59e0b", // Yellow
                            "#10b981", // Green
                            "#3b82f6", // Blue
                            "#8b5cf6", // Purple
                            "#ec4899", // Pink
                          ].map((color) => (
                            <button
                              key={color}
                              onClick={() => setTextColor(color)}
                              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                textColor === color
                                  ? "border-white scale-110 ring-2 ring-white/50"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        <div className="flex justify-center gap-2 mt-6">
                          <button
                            onClick={handleAddText}
                            className="px-4 py-2 bg-white text-black rounded-full font-bold"
                          >
                            Готово
                          </button>
                          <button
                            onClick={() => setShowTextInput(false)}
                            className="px-4 py-2 bg-white/20 text-white rounded-full font-bold"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl text-gray-600">↑</span>
                  </div>
                  <p className="text-gray-400">
                    Перетащите сюда фото или видео
                  </p>
                  <label className="mt-4 inline-block px-6 py-2 bg-white text-black rounded-lg cursor-pointer hover:bg-gray-200 transition-colors font-medium">
                    Выбрать файл
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              )}
              {storyPreview && (
                <button
                  onClick={() => {
                    setStoryFile(null);
                    setStoryPreview(null);
                    setTextOverlays([]);
                    setStickers([]);
                  }}
                  className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 rounded-full p-2 z-10"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-[#333] p-6 flex flex-col relative">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-white font-medium">История</h3>
                <button
                  onClick={() => setShowStoryModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1">
                {/* Tools */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowTextInput(true)}
                    disabled={!storyPreview}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 rounded flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Aa</span> Текст
                  </button>
                  <button
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    disabled={!storyPreview}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 rounded flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>☺</span> Стикеры
                  </button>
                </div>

                {/* Sticker Picker */}
                {showStickerPicker && (
                  <div className="absolute left-0 right-0 bottom-20 bg-[#222] border-t border-gray-700 p-4 grid grid-cols-5 gap-2 h-48 overflow-y-auto animate-fade-in z-20">
                    {[
                      "😀",
                      "😂",
                      "😍",
                      "😎",
                      "😭",
                      "😡",
                      "👍",
                      "👎",
                      "🔥",
                      "❤️",
                      "🎉",
                      "💩",
                      "👻",
                      "👽",
                      "🤖",
                      "🎃",
                      "🎄",
                      "🎁",
                      "🎈",
                      "🎵",
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddSticker(emoji)}
                        className="text-2xl hover:bg-white/10 rounded p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <button
                  onClick={handleCreateStory}
                  disabled={!storyFile || uploadingStory}
                  className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingStory ? "Публикация..." : "Опубликовать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="card p-3 sticky top-[70px] z-30 shadow-md bg-white/90 backdrop-blur-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск новостей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* Stories Strip */}
          <div className="card p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {/* Create Story */}
              <div
                onClick={() => setShowStoryModal(true)}
                className="w-24 flex flex-col gap-2 cursor-pointer group"
              >
                <div className="w-24 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-indigo-300 flex items-center justify-center group-hover:bg-indigo-50 transition-colors relative overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-1">
                      +
                    </div>
                    <span className="text-xs text-indigo-600 font-medium">
                      История
                    </span>
                  </div>
                  {currentUserAvatar && (
                    <div className="absolute bottom-2 right-2">
                      <UserAvatar
                        avatar={currentUserAvatar}
                        name={currentUser || "User"}
                        size={24}
                        className="border border-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Real Stories */}
              {stories.map((userStory) => (
                <div
                  key={userStory.username}
                  className="w-24 flex flex-col gap-2 cursor-pointer group"
                >
                  <div className="w-24 h-32 rounded-xl bg-black relative overflow-hidden ring-2 ring-offset-2 ring-indigo-500 group-hover:scale-105 transition-transform">
                    {userStory.items[0].type === "video" ? (
                      <video
                        src={userStory.items[0].mediaUrl}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <img
                        src={userStory.items[0].mediaUrl}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                    )}
                    <div className="absolute bottom-2 left-2 text-white text-xs font-medium truncate w-20 z-10">
                      {userStory.name}
                    </div>
                    <div className="absolute top-2 left-2 z-10">
                      <UserAvatar
                        avatar={userStory.avatar}
                        name={userStory.name}
                        size={32}
                        className="border-2 border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Post */}
          <div className="card p-4">
            <form onSubmit={handleCreatePost}>
              <div className="flex gap-3">
                <Link href="/profile">
                  <UserAvatar
                    avatar={currentUserAvatar}
                    name={currentUser || "User"}
                    size={40}
                    className="hover:opacity-90 transition-opacity"
                  />
                </Link>
                <div className="flex-1">
                  <textarea
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-200 resize-none transition-all text-sm min-h-[44px]"
                    placeholder="Что у вас нового?"
                    rows={newPostText ? 3 : 1}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    maxLength={5000}
                  />
                  {newPostText && (
                    <div className="mt-3 flex justify-between items-center animate-fade-in">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                          📷
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                          🎵
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                          📊
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!newPostText.trim() || posting}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {posting ? "..." : "Опубликовать"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.map((post) => (
              <PostComponent
                key={post.id}
                id={post.id}
                username={post.authorName || post.author}
                avatar={post.authorAvatar}
                content={post.content}
                image_url={post.image_url}
                likes={post.likes.length}
                comments={post.comments.length}
                created_at={post.createdAt}
                isLiked={post.likes.includes(currentUser || "")}
                isOwner={post.author === currentUser}
                onLike={() => handleLike(post.id)}
                views={post.views}
                isFriend={post.isFriend}
                commentsList={post.comments}
                currentUser={currentUser || undefined}
              />
            ))}
          </div>

          {/* Loading / Empty States */}
          {hasMore && (
            <div ref={observerTarget} className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="py-8 text-center text-gray-400 text-sm font-medium uppercase tracking-wider">
              Вы достигли конца ленты
            </div>
          )}

          {posts.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-50">✨</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Пока нет постов
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "По вашему запросу ничего не найдено"
                  : "Станьте первым, кто поделится чем-то интересным!"}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar (Filters & Recommendations) */}
        <div className="hidden lg:block space-y-4">
          {/* Feed Filters */}
          <div className="card p-2 sticky top-[70px]">
            <div className="flex flex-col gap-2 mb-2 px-3 pt-2">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSortMode("interesting")}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    sortMode === "interesting"
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Сначала интересные
                </button>
                <button
                  onClick={() => setSortMode("recent")}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    sortMode === "recent"
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  По времени
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <button
                onClick={() => setActiveFilter("all")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeFilter === "all"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">📰</span> Все новости
              </button>
              <button
                onClick={() => setActiveFilter("friends")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeFilter === "friends"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">👥</span> Друзья
              </button>
              <button
                onClick={() => setActiveFilter("media")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeFilter === "media"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">📷</span> Фото и видео
              </button>
              <button
                onClick={() => setActiveFilter("text")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeFilter === "text"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">📝</span> Текстовые
              </button>
              <div className="h-px bg-gray-100 my-1"></div>
              <button
                onClick={() => setActiveFilter("liked")}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeFilter === "liked"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">❤️</span> Понравилось
              </button>
            </div>
          </div>

          {/* Recommendations Widget */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
              Рекомендации
            </h3>
            <RecommendationsList />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsList() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error);
  }, []);

  if (users.length === 0) return null;

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3">
          <Link href={`/profile/${user.username}`}>
            <UserAvatar
              avatar={user.avatar}
              name={user.name || user.username}
              size={32}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${user.username}`}
              className="text-sm font-bold text-gray-800 truncate hover:text-indigo-600 block"
            >
              {user.name}
            </Link>
            <div className="text-xs text-gray-500">
              {user.followersCount} друзей
            </div>
          </div>
          <Link
            href={`/profile/${user.username}`}
            className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
          >
            +
          </Link>
        </div>
      ))}
    </div>
  );
}
