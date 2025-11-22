"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function FollowersPage() {
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/followers")
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setFollowers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setFollowers([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Загрузка...</div>;
  }

  return (
    <main className="max-w-xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile" className="text-indigo-600 hover:underline">
          ← Назад
        </Link>
        <h1 className="text-2xl font-bold">Подписчики</h1>
      </div>

      {followers.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          У вас пока нет подписчиков
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {followers.map((f: any) => (
            <Link
              key={f.username}
              href={`/profile/${f.username}`}
              className="card p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <img
                src={f.avatar ? `/uploads/${f.avatar}` : "/default-avatar.png"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium">@{f.username}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
