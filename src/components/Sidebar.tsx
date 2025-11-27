"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const sidebar = [
  { href: "/profile", label: "Профиль", icon: "👤" },
  { href: "/feed", label: "Лента", icon: "📰" },
  { href: "/messages", label: "Мессенджер", icon: "💬" },
  { href: "/friends", label: "Друзья", icon: "👥" },
  { href: "/communities", label: "Сообщества", icon: "🏛️" },
  { href: "/photos", label: "Фото", icon: "📷" },
  { href: "/music", label: "Музыка", icon: "🎵" },
  { href: "/video", label: "Видео", icon: "🎬" },
  { href: "/games", label: "Игры", icon: "🎮" },
  { href: "/market", label: "Маркет", icon: "🛒" },
  { href: "/bookmarks", label: "Закладки", icon: "🔖" },
  { href: "/settings", label: "Настройки", icon: "⚙️" },
  { href: "/help", label: "Помощь", icon: "❓" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) setRole(data.role);
      })
      .catch(() => {});
  }, []);

  const menuItems = [...sidebar];
  if (role === "ADMIN" || role === "OWNER") {
    menuItems.unshift({ href: "/admin", label: "Админ-панель", icon: "🛡️" });
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-4">
        <nav className="card p-4 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/admin" && pathname.startsWith("/admin"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                <span
                  className={`text-xl transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="card p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Ваши сообщества
          </div>
          {/* Placeholder for communities */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                IT
              </div>
              <div className="text-sm font-medium text-gray-700">IT & Tech</div>
            </div>
            <div className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                GD
              </div>
              <div className="text-sm font-medium text-gray-700">Game Dev</div>
            </div>
          </div>
        </div>

        <div className="px-4 text-xs text-gray-400 text-center">
          © 2025 Lumina Social
          <br />
          <Link href="/legal/terms" className="hover:underline">
            Правила
          </Link>{" "}
          •{" "}
          <Link href="/legal/privacy" className="hover:underline">
            Конфиденциальность
          </Link>
        </div>
      </div>
    </aside>
  );
}
