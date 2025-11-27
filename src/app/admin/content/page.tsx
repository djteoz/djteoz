"use client";

import { useState, useEffect } from "react";
import { UserAvatar } from "../../../components/UserAvatar";
import Link from "next/link";

interface ContentItem {
  id: string;
  content?: string; // Post
  title?: string; // Music/Video
  artist?: string; // Music
  description?: string; // Video
  createdAt: string;
  author?: { // Post
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  uploader?: { // Music/Video
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  _count?: {
    comments: number;
    reports: number;
  };
  likes?: string[];
}

type ContentType = "posts" | "music" | "video";

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<ContentType>("posts");

  useEffect(() => {
    fetchContent();
  }, [page, activeTab]);

  const fetchContent = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?type=${activeTab}&q=${query}&page=${page}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContent(search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот контент? Это действие необратимо.")) return;

    try {
      const res = await fetch(`/api/admin/content/${id}?type=${activeTab}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
      } else {
        alert("Ошибка при удалении");
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  const getAuthor = (item: ContentItem) => item.author || item.uploader;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Управление контентом</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Поиск..."
            className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 outline-none w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Найти
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab("posts"); setPage(1); }}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "posts" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Посты
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("music"); setPage(1); }}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "music" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Музыка
          {activeTab === "music" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("video"); setPage(1); }}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "video" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Видео
          {activeTab === "video" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500">Автор</th>
                <th className="px-6 py-4 font-medium text-gray-500 w-1/2">Контент</th>
                <th className="px-6 py-4 font-medium text-gray-500">Инфо</th>
                <th className="px-6 py-4 font-medium text-gray-500">Дата</th>
                <th className="px-6 py-4 font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Загрузка...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Контент не найден
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const author = getAuthor(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        {author && (
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              avatar={author.avatar}
                              name={author.username}
                              size={32}
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {author.firstName} {author.lastName}
                              </div>
                              <div className="text-gray-500">@{author.username}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "posts" && (
                          <p className="line-clamp-2 text-gray-600">{item.content}</p>
                        )}
                        {activeTab === "music" && (
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-gray-500 text-xs">{item.artist}</div>
                          </div>
                        )}
                        {activeTab === "video" && (
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-gray-500 text-xs line-clamp-1">{item.description}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "posts" && item._count && (
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span title="Лайки">❤️ {item.likes?.length || 0}</span>
                            <span title="Комментарии">💬 {item._count.comments}</span>
                            {item._count.reports > 0 && (
                              <span title="Жалобы" className="text-red-600 font-bold">⚠️ {item._count.reports}</span>
                            )}
                          </div>
                        )}
                        {activeTab !== "posts" && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {activeTab === "posts" && (
                            <Link 
                              href={`/feed?post=${item.id}`} 
                              target="_blank"
                              className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              Просмотр
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-xs px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
            >
              Назад
            </button>
            <span className="px-3 py-1 text-gray-600">
              Страница {page} из {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
