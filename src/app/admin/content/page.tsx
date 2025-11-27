"use client";

import { useState, useEffect } from "react";
import { UserAvatar } from "../../../components/UserAvatar";
import Link from "next/link";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  _count: {
    comments: number;
    reports: number;
  };
  likes: string[];
}

export default function AdminContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?q=${query}&page=${page}`);
      const data = await res.json();
      setPosts(data.posts || []);
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
    fetchPosts(search);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот пост? Это действие необратимо.")) return;

    try {
      const res = await fetch(`/api/admin/content/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
      } else {
        alert("Ошибка при удалении поста");
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Управление контентом</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Поиск по тексту или автору..."
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500">Автор</th>
                <th className="px-6 py-4 font-medium text-gray-500 w-1/2">Контент</th>
                <th className="px-6 py-4 font-medium text-gray-500">Статистика</th>
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
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Посты не найдены
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatar={post.author.avatar}
                          name={post.author.username}
                          size={32}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {post.author.firstName} {post.author.lastName}
                          </div>
                          <div className="text-gray-500">@{post.author.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 text-gray-600">{post.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span title="Лайки">❤️ {post.likes.length}</span>
                        <span title="Комментарии">💬 {post._count.comments}</span>
                        {post._count.reports > 0 && (
                          <span title="Жалобы" className="text-red-600 font-bold">⚠️ {post._count.reports}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/feed?post=${post.id}`} 
                          target="_blank"
                          className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          Просмотр
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-xs px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
