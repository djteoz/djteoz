"use client";

import { useState, useEffect } from "react";
import { UserAvatar } from "../../../components/UserAvatar";
import Link from "next/link";

interface Report {
  id: string;
  reason: string;
  createdAt: string;
  reporter: {
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  post: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
    };
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReports(reports.filter((r) => r.id !== reportId));
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    if (!confirm("Удалить пост? Это действие также закроет жалобу.")) return;

    try {
      // Delete post
      const res = await fetch(`/api/admin/content/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove all reports related to this post from UI
        setReports(reports.filter((r) => r.post.id !== postId));
      } else {
        alert("Ошибка при удалении поста");
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm("Заблокировать автора поста?")) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: true }),
      });

      if (res.ok) {
        alert("Пользователь заблокирован");
      } else {
        alert("Ошибка при блокировке");
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Жалобы</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500">Жалоба от</th>
                <th className="px-6 py-4 font-medium text-gray-500">Причина</th>
                <th className="px-6 py-4 font-medium text-gray-500 w-1/3">Контент</th>
                <th className="px-6 py-4 font-medium text-gray-500">Автор контента</th>
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
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Жалоб нет
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          avatar={report.reporter.avatar}
                          name={report.reporter.username}
                          size={24}
                        />
                        <span className="text-gray-900">@{report.reporter.username}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {report.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-3 text-gray-600 italic">"{report.post.content}"</p>
                      <Link 
                        href={`/feed?post=${report.post.id}`} 
                        target="_blank"
                        className="text-xs text-indigo-600 hover:underline mt-1 block"
                      >
                        Открыть пост
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          avatar={report.post.author.avatar}
                          name={report.post.author.username}
                          size={24}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {report.post.author.firstName} {report.post.author.lastName}
                          </div>
                          <div className="text-xs text-gray-500">@{report.post.author.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleDeletePost(report.post.id, report.id)}
                          className="text-xs px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 text-center"
                        >
                          Удалить пост
                        </button>
                        <button
                          onClick={() => handleBanUser(report.post.author.id)}
                          className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 text-center"
                        >
                          Блок. автора
                        </button>
                        <button
                          onClick={() => handleDismiss(report.id)}
                          className="text-xs px-3 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 text-center"
                        >
                          Отклонить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
