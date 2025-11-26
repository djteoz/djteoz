"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Post, PostProps } from "../../components/Post";
import { UserAvatar } from "../../components/UserAvatar";

interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  cover?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  email?: string;
  city?: string;
  country?: string;
  birthday?: string;
  website?: string;
  interests?: string;
  phone?: string;
  work?: string;
  education?: string;
  languages?: string;
  isPublic?: boolean;
  profileViews?: number;
  gender?: "male" | "female" | "other";
  createdAt?: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [musicList, setMusicList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all"); // all, my, archive
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  // Stories
  const [userStories, setUserStories] = useState<any[]>([]);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const storyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const coverFileInput = useRef<HTMLInputElement>(null);
  const postFileInput = useRef<HTMLInputElement>(null);
  const musicFileInput = useRef<HTMLInputElement>(null);

  const fetchPosts = async (username: string) => {
    try {
      const res = await fetch(`/api/posts?username=${username}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const formattedPosts = data.posts.map((post: any) => ({
          id: post.id,
          username: post.author,
          avatar: post.authorAvatar,
          content: post.content,
          image_url: post.image_url,
          created_at: post.createdAt,
          likes: post.likes.length,
          comments: post.commentsCount,
          commentsList: post.comments,
          isLiked: post.likes.includes(username),
        }));
        setPosts(formattedPosts);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  };

  const fetchMusic = async () => {
    try {
      const res = await fetch("/api/music");
      if (res.ok) {
        const data = await res.json();
        setMusicList(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch music", err);
    }
  };

  const fetchStories = async (username: string) => {
    try {
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        // Filter stories for this user
        const userStoryGroup = data.find((group: any) => group.username === username);
        if (userStoryGroup) {
          setUserStories(userStoryGroup.items);
        } else {
          setUserStories([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stories", err);
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
        if (data) {
          setProfile(data);
          setFormData(data);
          setStatusText(data.bio || "");
          fetchPosts(data.username);
          fetchFriends();
          fetchMusic();
          fetchStories(data.username);
        } else {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // Story Viewer Logic
  useEffect(() => {
    if (viewingStoryIndex === null) return;

    const currentStory = userStories[viewingStoryIndex];
    if (!currentStory) {
      closeStoryViewer();
      return;
    }

    const duration = currentStory.type === 'video' ? 30000 : 5000;
    const interval = 50;
    const step = 100 / (duration / interval);

    setStoryProgress(0);

    storyTimerRef.current = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          handleNextStory();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (storyTimerRef.current) clearInterval(storyTimerRef.current);
    };
  }, [viewingStoryIndex, userStories]);

  const handleNextStory = () => {
    if (viewingStoryIndex === null) return;

    if (viewingStoryIndex < userStories.length - 1) {
      setViewingStoryIndex(prev => (prev !== null ? prev + 1 : null));
      setStoryProgress(0);
    } else {
      closeStoryViewer();
    }
  };

  const handlePrevStory = () => {
    if (viewingStoryIndex === null) return;

    if (viewingStoryIndex > 0) {
      setViewingStoryIndex(prev => (prev !== null ? prev - 1 : null));
      setStoryProgress(0);
    } else {
      setStoryProgress(0);
    }
  };

  const closeStoryViewer = () => {
    setViewingStoryIndex(null);
    setStoryProgress(0);
    if (storyTimerRef.current) clearInterval(storyTimerRef.current);
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Удалить эту историю?")) return;
    
    try {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const newStories = userStories.filter(s => s.id !== storyId);
        setUserStories(newStories);
        if (newStories.length === 0) {
          closeStoryViewer();
        } else if (viewingStoryIndex !== null && viewingStoryIndex >= newStories.length) {
          setViewingStoryIndex(newStories.length - 1);
        }
      }
    } catch (e) {
      console.error("Failed to delete story", e);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setError("");
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setProfile(formData as UserProfile);
      setEditMode(false);
      setMessage("Профиль успешно обновлен!");
    } else {
      setError("Ошибка при сохранении профиля");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("avatar", file);

    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      credentials: "include",
      body: formDataUpload,
    });

    if (res.ok) {
      const data = await res.json();
      setProfile((prev) => (prev ? { ...prev, avatar: data.avatar } : null));
      setFormData((prev) => ({ ...prev, avatar: data.avatar }));
      setMessage("Аватар обновлен!");
    } else {
      setError("Ошибка при загрузке аватара");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        // Update profile with new cover URL
        const updateRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, cover: data.url }),
        });

        if (updateRes.ok) {
          setProfile((prev) => (prev ? { ...prev, cover: data.url } : null));
          setMessage("Обложка обновлена!");
        } else {
          setError("Ошибка при сохранении обложки");
        }
      } else {
        setError("Ошибка при загрузке обложки");
      }
    } catch (err) {
      setError("Ошибка сети при загрузке обложки");
    }
  };

  const handleSaveStatus = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, bio: statusText }),
      });

      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, bio: statusText } : null));
        setIsEditingStatus(false);
        setMessage("Статус обновлен!");
      } else {
        setError("Ошибка при сохранении статуса");
      }
    } catch (err) {
      setError("Ошибка сети");
    }
  };

  const handlePostImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setNewPostImage(data.url);
      } else {
        setError("Ошибка при загрузке изображения");
      }
    } catch (err) {
      setError("Ошибка сети при загрузке изображения");
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setNewPostContent((prev) => `${prev}\n🎵 ${file.name}: ${data.url}`);
        setMessage("Музыка добавлена к посту!");
      } else {
        setError("Ошибка при загрузке музыки");
      }
    } catch (err) {
      setError("Ошибка сети при загрузке музыки");
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          image: newPostImage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newPost: PostProps = {
          id: data.post.id,
          username: data.post.author,
          avatar: data.post.authorAvatar,
          content: data.post.content,
          image_url: data.post.image_url,
          created_at: data.post.createdAt,
          likes: 0,
          comments: 0,
        };
        setPosts([newPost, ...posts]);
        setNewPostContent("");
        setNewPostImage(null);
        setMessage("Запись опубликована!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError("Не удалось опубликовать запись");
      }
    } catch (err) {
      setError("Ошибка сети");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот пост?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
        setMessage("Пост удален");
      } else {
        setError("Не удалось удалить пост");
      }
    } catch (err) {
      setError("Ошибка сети");
    }
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (res.ok) {
        setPosts(
          posts.map((p) =>
            p.id === postId ? { ...p, content: newContent } : p
          )
        );
        setMessage("Пост обновлен");
      } else {
        setError("Не удалось обновить пост");
      }
    } catch (err) {
      setError("Ошибка сети");
    }
  };

  const handleLikeComment = async (
    postId: string,
    commentId: string,
    isLiked: boolean
  ) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isLiked ? "unlike" : "like" }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                commentsList: post.commentsList?.map((c) => {
                  if (c.id === commentId) {
                    return {
                      ...c,
                      likes: data.likes,
                    };
                  }
                  return c;
                }),
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error("Failed to like comment", err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Удалить комментарий?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: post.comments - 1,
                commentsList: post.commentsList?.filter(
                  (c) => c.id !== commentId
                ),
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const postIndex = posts.findIndex((p) => p.id === postId);
      if (postIndex === -1) return;

      const isLiked = posts[postIndex].isLiked;

      // Optimistic update
      const newPosts = [...posts];
      newPosts[postIndex] = {
        ...newPosts[postIndex],
        isLiked: !isLiked,
        likes: isLiked
          ? newPosts[postIndex].likes - 1
          : newPosts[postIndex].likes + 1,
      };
      setPosts(newPosts);

      const res = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isLiked ? "unlike" : "like" }),
      });

      if (!res.ok) {
        // Revert if failed
        setPosts(posts);
      }
    } catch (err) {
      console.error("Failed to like post", err);
      setPosts(posts);
    }
  };

  const handleComment = async (postId: string, text: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", comment: text }),
      });

      if (res.ok) {
        const data = await res.json();
        const newComment = data.comment;

        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: post.comments + 1,
                commentsList: [...(post.commentsList || []), newComment],
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url);
    setMessage("Ссылка на пост скопирована!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${profile?.username}`;
    navigator.clipboard.writeText(url);
    setMessage("Ссылка на профиль скопирована!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
        <div className="text-lg text-red-600">
          Ошибка загрузки профиля. Пожалуйста, войдите заново.
        </div>
        <Link href="/login" className="text-indigo-600 hover:underline">
          Вернуться на логин
        </Link>
      </div>
    );
  }

  const fullName =
    [formData.firstName, formData.lastName].filter(Boolean).join(" ") ||
    profile.username;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Сообщения */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 animate-fade-in">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 animate-fade-in">
          {error}
        </div>
      )}

      {/* Story Viewer Overlay */}
      {viewingStoryIndex !== null && userStories[viewingStoryIndex] && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          <button 
            onClick={closeStoryViewer}
            className="absolute top-4 right-4 text-white z-20 p-2 hover:bg-white/10 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="relative w-full max-w-md h-full md:h-[90vh] bg-black md:rounded-xl overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
              {userStories.map((item: any, idx: number) => (
                <div key={item.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{ 
                      width: idx < viewingStoryIndex ? '100%' : 
                             idx === viewingStoryIndex ? `${storyProgress}%` : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-4 left-0 right-0 z-20 px-4 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  avatar={profile.avatar} 
                  name={fullName} 
                  size={32}
                  className="border border-white/20"
                />
                <div className="flex flex-col">
                  <span className="text-white font-medium text-sm shadow-black drop-shadow-md">
                    {fullName}
                  </span>
                  <span className="text-white/70 text-xs shadow-black drop-shadow-md">
                    {new Date(userStories[viewingStoryIndex].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStory(userStories[viewingStoryIndex].id);
                }}
                className="text-white/70 hover:text-red-500 p-2 transition-colors"
                title="Удалить историю"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            <div className="absolute inset-0 z-10 flex">
              <div className="w-1/3 h-full" onClick={handlePrevStory} />
              <div className="w-1/3 h-full" onClick={handleNextStory} />
              <div className="w-1/3 h-full" onClick={handleNextStory} />
            </div>

            <div className="flex-1 bg-black flex items-center justify-center relative">
              {userStories[viewingStoryIndex].type === 'video' ? (
                <video
                  src={userStories[viewingStoryIndex].mediaUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  onEnded={handleNextStory}
                />
              ) : (
                <img
                  src={userStories[viewingStoryIndex].mediaUrl}
                  className="w-full h-full object-contain"
                  alt="Story"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* VK-style Header Card */}
      <div className="card p-0 mb-4 overflow-hidden relative group">
        {/* Cover Image */}
        <div
          className="h-48 md:h-64 bg-cover bg-center relative bg-gray-200"
          style={{
            backgroundImage: profile.cover
              ? `url(${profile.cover})`
              : "linear-gradient(to right, #818cf8, #c084fc, #f472b6)",
          }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          {/* Edit Cover Button */}
          <button
            onClick={() => coverFileInput.current?.click()}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            Изменить обложку
          </button>
          <input
            ref={coverFileInput}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleCoverUpload}
          />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start relative">
            {/* Avatar - Overlapping */}
            <div className="-mt-16 md:-mt-20 relative z-10 mr-6">
              <div className="relative group/avatar">
                <div 
                  className={`relative rounded-full p-1 ${userStories.length > 0 ? 'bg-gradient-to-tr from-yellow-400 to-purple-600 cursor-pointer' : 'bg-white'}`}
                  onClick={() => userStories.length > 0 && setViewingStoryIndex(0)}
                >
                  <UserAvatar
                    avatar={profile.avatar}
                    name={fullName}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg text-4xl md:text-6xl"
                  />
                </div>
                
                {/* Avatar Dropdown Menu */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all z-20 overflow-hidden">
                  {userStories.length > 0 && (
                    <button
                      onClick={() => setViewingStoryIndex(0)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>👁️</span> Смотреть историю
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/feed')} // Redirect to feed to create story for now
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>➕</span> Новая история
                  </button>
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📷</span> Изменить фото
                  </button>
                  {userStories.length > 0 && (
                    <button
                      onClick={() => {
                        if(confirm("Удалить все истории?")) {
                          // Logic to delete all stories would go here
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                    >
                      <span>🗑️</span> Удалить истории
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Header Info */}
            <div className="flex-1 pt-4 md:pt-2 min-w-0 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                      {fullName}
                    </h1>
                    <span
                      className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"
                      title="Онлайн"
                    ></span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    @{profile.username}
                  </div>
                  {isEditingStatus ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={statusText}
                        onChange={(e) => setStatusText(e.target.value)}
                        className="border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveStatus}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingStatus(false);
                          setStatusText(profile.bio || "");
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <p
                      className="text-gray-500 text-sm mt-1 cursor-pointer hover:bg-gray-50 px-2 -ml-2 py-1 rounded transition-colors border border-transparent hover:border-gray-200"
                      onClick={() => setIsEditingStatus(true)}
                      title="Нажмите, чтобы изменить статус"
                    >
                      {profile.bio || "установить статус"}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 text-sm font-medium"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => router.push("/messages")}
                        className="btn bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-sm font-medium flex items-center gap-2"
                      >
                        <span>✉️</span> Сообщения
                      </button>
                      <button
                        onClick={() => router.push("/friends")}
                        className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 text-sm font-medium"
                        title="Друзья"
                      >
                        👤
                      </button>
                      <button
                        onClick={handleShareProfile}
                        className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 text-sm font-medium"
                        title="Поделиться"
                      >
                        ↗️
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="btn btn-primary px-6 py-2 text-sm"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setFormData(profile);
                        }}
                        className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Row */}
              <div className="flex gap-6 mt-4 text-sm border-t border-gray-100 pt-3">
                <Link
                  href="/friends"
                  className="text-center cursor-pointer hover:opacity-75 transition-opacity"
                >
                  <div className="font-bold text-gray-900 text-lg">
                    {friends.length}
                  </div>
                  <div className="text-gray-500 text-xs">друзей</div>
                </Link>
                <Link
                  href="/followers"
                  className="text-center cursor-pointer hover:opacity-75 transition-opacity"
                >
                  <div className="font-bold text-gray-900 text-lg">
                    {friends.length}
                  </div>
                  <div className="text-gray-500 text-xs">подписчика</div>
                </Link>
                <div
                  className="text-center cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => {
                    setActiveTab("all");
                    document
                      .getElementById("posts-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <div className="font-bold text-gray-900 text-lg">
                    {posts.length}
                  </div>
                  <div className="text-gray-500 text-xs">постов</div>
                </div>
                <div
                  className="text-center cursor-pointer hover:opacity-75 transition-opacity"
                  title="Статистика просмотров"
                >
                  <div className="font-bold text-gray-900 text-lg">
                    {profile.profileViews || 0}
                  </div>
                  <div className="text-gray-500 text-xs">просмотров</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs / Navigation */}
          <div className="mt-4 border-t border-gray-100 pt-2 hidden md:flex gap-1">
            {[
              { id: "all", label: "Все записи" },
              { id: "my", label: "Мои записи" },
              { id: "archive", label: "Архив" },
              { id: "photos", label: "Фото" },
              { id: "videos", label: "Видео" },
              { id: "articles", label: "Статьи" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (Sidebar in VK, but usually Right in modern layouts, let's stick to VK: Left is Content, Right (Widgets). We have Nav in Layout. So we need Center + Right. */}

        {/* Center Column (Content) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Edit Form (if active) */}
          {editMode && (
            <div className="card p-6 animate-fade-in">
              <h3 className="text-lg font-bold mb-4">Основная информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Имя"
                  className="input"
                  value={formData.firstName || ""}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Фамилия"
                  className="input"
                  value={formData.lastName || ""}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="city"
                  placeholder="Город"
                  className="input"
                  value={formData.city || ""}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Страна"
                  className="input"
                  value={formData.country || ""}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="work"
                  placeholder="Место работы"
                  className="input"
                  value={formData.work || ""}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="education"
                  placeholder="Образование"
                  className="input"
                  value={formData.education || ""}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="languages"
                  placeholder="Языки"
                  className="input"
                  value={formData.languages || ""}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="website"
                  placeholder="Веб-сайт"
                  className="input"
                  value={formData.website || ""}
                  onChange={handleInputChange}
                />
                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Открытый профиль (виден всем)
                  </label>
                </div>
                <textarea
                  name="bio"
                  placeholder="О себе"
                  className="input md:col-span-2"
                  value={formData.bio || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          {/* Create Post Box */}
          <div className="card p-4">
            <div className="flex gap-3">
              <UserAvatar avatar={profile.avatar} name={fullName} size={32} />
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Что у вас нового?"
                  className="w-full bg-gray-100 hover:bg-white focus:bg-white border border-transparent focus:border-indigo-200 rounded-xl px-4 py-2 text-sm transition-all resize-none outline-none min-h-[40px]"
                  rows={newPostContent ? 3 : 1}
                />
                {newPostImage && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={newPostImage}
                      alt="Preview"
                      className="max-h-48 rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setNewPostImage(null)}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {(newPostContent || newPostImage) && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleCreatePost}
                      className="btn btn-primary px-4 py-1 text-sm"
                    >
                      Опубликовать
                    </button>
                  </div>
                )}
              </div>
            </div>
            {!newPostContent && !newPostImage && (
              <div className="flex justify-end gap-2 mt-2 text-gray-400">
                <button
                  onClick={() => postFileInput.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  📷
                </button>
                <input
                  ref={postFileInput}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePostImageUpload}
                />
                <button
                  onClick={() => musicFileInput.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  🎵
                </button>
                <input
                  ref={musicFileInput}
                  type="file"
                  className="hidden"
                  accept="audio/*"
                  onChange={handleMusicUpload}
                />
              </div>
            )}
          </div>

          {/* Photos Block (Mobile Only) */}
          <div className="card p-4 lg:hidden">
            <h3 className="font-medium text-gray-900 mb-3">
              Фотографии <span className="text-gray-400 ml-1">12</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded-md"
                ></div>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div id="posts-section" className="space-y-4">
            {posts.length > 0 ? (
              posts
                .filter((post) => {
                  if (activeTab === "my")
                    return post.username === profile.username;
                  if (activeTab === "archive") return false; // Placeholder
                  if (activeTab === "photos") return !!post.image_url;
                  if (activeTab === "videos") return false; // Placeholder
                  if (activeTab === "articles") return false; // Placeholder
                  return true;
                })
                .map((post) => (
                  <Post
                    key={post.id}
                    {...post}
                    currentUser={profile.username}
                    isOwner={post.username === profile.username}
                    onLike={() => handleLike(post.id)}
                    onComment={(text) => handleComment(post.id, text)}
                    onShare={() => handleShare(post.id)}
                    onDelete={() => handleDeletePost(post.id)}
                    onEdit={(newContent) => handleEditPost(post.id, newContent)}
                    onLikeComment={(commentId, isLiked) =>
                      handleLikeComment(post.id, commentId, isLiked)
                    }
                    onDeleteComment={(commentId) =>
                      handleDeleteComment(post.id, commentId)
                    }
                  />
                ))
            ) : (
              <div className="card p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>На стене пока нет записей</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-4">
          {/* Info Widget */}
          <div className="card p-4">
            <div className="space-y-3 text-sm">
              {(profile.city || profile.country) && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-gray-400">📍</span>
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-gray-400">🔗</span>
                  <a
                    href={profile.website}
                    className="text-indigo-600 hover:underline truncate"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.birthday && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-gray-400">🎂</span>
                  {new Date(profile.birthday).toLocaleDateString("ru-RU")}
                </div>
              )}
              {profile.work && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-gray-400">💼</span>
                  {profile.work}
                </div>
              )}
              {profile.education && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-gray-400">🎓</span>
                  {profile.education}
                </div>
              )}

              <button
                onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                className="w-full mt-2 py-1 text-center text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                {showDetailedInfo
                  ? "Скрыть подробности"
                  : "Подробная информация"}
              </button>

              {showDetailedInfo && (
                <div className="pt-3 border-t border-gray-100 space-y-2 animate-fade-in">
                  {profile.languages && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Языки</span>
                      <span className="text-gray-800">{profile.languages}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Email</span>
                      <span className="text-gray-800">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Телефон</span>
                      <span className="text-gray-800">{profile.phone}</span>
                    </div>
                  )}
                  {profile.interests && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Интересы</span>
                      <span className="text-gray-800">{profile.interests}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">ID</span>
                    <span className="text-gray-800">@{profile.username}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Friends Widget */}
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">
                Друзья{" "}
                <span className="text-gray-400 ml-1">{friends.length}</span>
              </h3>
            </div>
            {friends.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                {friends.slice(0, 6).map((friend) => (
                  <Link
                    key={friend.username}
                    href={`/profile/${friend.username}`}
                    className="text-center group"
                  >
                    <UserAvatar
                      avatar={friend.avatar}
                      name={friend.firstName || friend.username}
                      size={48}
                      className="mx-auto mb-1 border border-gray-100 group-hover:border-indigo-300 transition-colors"
                    />
                    <div className="text-xs text-gray-600 truncate group-hover:text-indigo-600 transition-colors">
                      {friend.firstName || friend.username}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm py-4">
                Список друзей пуст
              </div>
            )}
          </div>

          {/* Music Widget */}
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">Музыка</h3>
            </div>
            {musicList.length > 0 ? (
              <div className="space-y-2">
                {musicList.slice(0, 3).map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 p-1 rounded-lg -mx-1"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-xs text-indigo-600">
                      🎵
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-gray-800">
                        {track.title}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {track.artist}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm py-4">
                Нет аудиозаписей
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
