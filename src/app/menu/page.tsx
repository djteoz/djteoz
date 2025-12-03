"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const menuItems = [
  {
    href: "/friends",
    label: "Друзья",
    icon: "👥",
    color: "bg-blue-100 text-blue-600",
  },
  {
    href: "/communities",
    label: "Сообщества",
    icon: "🏛️",
    color: "bg-purple-100 text-purple-600",
  },
  {
    href: "/photos",
    label: "Фотографии",
    icon: "📷",
    color: "bg-pink-100 text-pink-600",
  },
  {
    href: "/music",
    label: "Музыка",
    icon: "🎵",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    href: "/video",
    label: "Видео",
    icon: "🎬",
    color: "bg-red-100 text-red-600",
  },
  {
    href: "/games",
    label: "Игры",
    icon: "🎮",
    color: "bg-green-100 text-green-600",
  },
  {
    href: "/market",
    label: "Маркет",
    icon: "🛒",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    href: "/bookmarks",
    label: "Закладки",
    icon: "🔖",
    color: "bg-gray-100 text-gray-600",
  },
  {
    href: "/settings",
    label: "Настройки",
    icon: "⚙️",
    color: "bg-gray-100 text-gray-600",
  },
  {
    href: "/help",
    label: "Помощь",
    icon: "❓",
    color: "bg-blue-50 text-blue-500",
  },
];

export default function MenuPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setRole(data.role);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="pb-20 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 px-2">Меню</h1>

      {(role === "ADMIN" || role === "OWNER") && (
        <Link
          href="/admin"
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white shadow-lg mx-2"
        >
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-lg">Админ-панель</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors gap-2"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${item.color}`}
            >
              {item.icon}
            </div>
            <span className="font-medium text-gray-700 text-sm">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="px-4 py-6 text-center">
        <Link
          href="/api/logout"
          className="text-red-600 font-medium hover:underline"
        >
          Выйти из аккаунта
        </Link>
        <div className="mt-4 text-xs text-gray-400">
          Lumina Social v2.0 © 2025
        </div>
      </div>
    </div>
  );
}
