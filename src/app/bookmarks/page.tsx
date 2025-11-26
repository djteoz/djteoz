"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Post } from "../../components/Post";
import { UserAvatar } from "../../components/UserAvatar";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'posts', 'photos', 'videos', 'communities', 'users'
  const [filterTag, setFilterTag] = useState("");

  useEffect(() => {
    fetchBookmarks();
  }, [activeTab, filterTag]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      let url = `/api/bookmarks?`;
      if (activeTab !== "all") url += `type=${activeTab}&`;
      if (filterTag) url += `tag=${encodeURIComponent(filterTag)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    if (!confirm("Удалить из закладок?")) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Закладки</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {[
          { id: "all", label: "Все" },
          { id: "posts", label: "Записи" },
          { id: "photos", label: "Фото" },
          { id: "videos", label: "Видео" },
          { id: "communities", label: "Сообщества" },
          { id: "users", label: "Люди" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          В закладках пока пусто
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="relative group">
              {/* Remove Button */}
              <button
                onClick={() => handleRemoveBookmark(bookmark.id)}
                className="absolute top-2 right-2 z-10 bg-white/80 p-1 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить из закладок"
              >
                ✕
              </button>

              {/* Render Content based on type */}
              {bookmark.post && (
                <Post
                  id={bookmark.post.id}
                  username={bookmark.post.author.username}
                  avatar={bookmark.post.author.avatar}
                  community={bookmark.post.community}
                  content={bookmark.post.content}
                  image_url={bookmark.post.image}
                  likes={0} // We don't fetch likes count here for simplicity, or we could
                  comments={0}
                  created_at={bookmark.post.createdAt}
                  // Disable actions that require more context or implement them later
                />
              )}

              {bookmark.community && (
                <div className="card p-4 flex items-center gap-4">
                  <UserAvatar
                    avatar={bookmark.community.avatar}
                    name={bookmark.community.name}
                    size={50}
                  />
                  <div>
                    <Link
                      href={`/communities/${bookmark.community.slug}`}
                      className="font-bold text-lg hover:text-indigo-600"
                    >
                      {bookmark.community.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {bookmark.community.membersCount} участников
                    </p>
                  </div>
                </div>
              )}

              {bookmark.targetUser && (
                <div className="card p-4 flex items-center gap-4">
                  <UserAvatar
                    avatar={bookmark.targetUser.avatar}
                    name={bookmark.targetUser.username}
                    size={50}
                  />
                  <div>
                    <Link
                      href={`/profile/${bookmark.targetUser.username}`}
                      className="font-bold text-lg hover:text-indigo-600"
                    >
                      {bookmark.targetUser.firstName}{" "}
                      {bookmark.targetUser.lastName}
                    </Link>
                    <p className="text-sm text-gray-500">
                      @{bookmark.targetUser.username}
                    </p>
                  </div>
                </div>
              )}

              {/* Add Photo/Video rendering if needed */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
