"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { UserAvatar } from "./UserAvatar";

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{
    username: string;
    avatar?: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // load profile
    fetch("/api/profile", { credentials: "include" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));

    // Load unread messages count
    const loadUnreadMessages = async () => {
      try {
        const res = await fetch("/api/messages", { credentials: "include" });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;
        const data = await res.json();
        const totalUnread = (data.conversations || []).reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0),
          0
        );
        setUnreadMessages(totalUnread);
      } catch (err) {
        console.error("Failed to load unread messages:", err);
      }
    };

    loadUnreadMessages();
    // Refresh unread count every 30 seconds
    const interval = setInterval(loadUnreadMessages, 30000);

    // Закрыть меню при клике вне его
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Поиск с дебаунсом
  useEffect(() => {
    if (!search || search.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`, {
          credentials: "include",
        });
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <nav className="w-full glass sticky top-0 z-50 mb-6">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-3 justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 select-none hover:scale-105 transition-transform duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white font-bold text-xl">
            L
          </div>
          <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
            Lumina
          </span>
        </Link>

        {/* Поиск */}
        <div
          className="flex-1 max-w-md mx-4 hidden md:block relative"
          ref={searchRef}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100/50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              placeholder="Поиск людей..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 top-full mt-2 w-full bg-white/90 backdrop-blur-xl border border-gray-100 rounded-xl shadow-xl z-50 max-h-80 overflow-auto animate-fade-in">
              {suggestions.map((s) => {
                const fullName =
                  [s.firstName, s.lastName].filter(Boolean).join(" ") ||
                  s.username;
                return (
                  <Link
                    key={s.username}
                    href={`/profile/${s.username}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 transition-colors border-b border-gray-50 last:border-b-0"
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearch("");
                    }}
                  >
                    <UserAvatar avatar={s.avatar} name={fullName} size={40} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">
                        {fullName}
                      </div>
                      <div className="text-xs text-gray-500">@{s.username}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {profile ? (
            <div className="flex items-center gap-4">
              {/* Messages badge */}
              <Link
                href="/messages"
                className="relative p-2 rounded-xl hover:bg-gray-100/50 transition-colors text-gray-600 hover:text-indigo-600"
                title="Сообщения"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>

              <div className="relative" ref={profileMenuRef}>
                <button
                  className="flex items-center gap-2 hover:opacity-80 transition"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <UserAvatar
                    avatar={profile.avatar}
                    name={profile.username}
                    size={40}
                    className="border-2 border-white shadow-md"
                  />
                </button>

                {/* Дропдаун меню */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-3 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl z-50 w-56 animate-fade-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-800">
                        {profile.username}
                      </p>
                      <p className="text-xs text-gray-500">В сети</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 hover:bg-indigo-50 text-gray-700 text-sm transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      👤 Мой профиль
                    </Link>
                    <Link
                      href="/friends"
                      className="block px-4 py-2.5 hover:bg-indigo-50 text-gray-700 text-sm transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      👥 Друзья
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2.5 hover:bg-indigo-50 text-gray-700 text-sm transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      ⚙️ Настройки
                    </Link>
                    <Link
                      href="/help"
                      className="block px-4 py-2.5 hover:bg-indigo-50 text-gray-700 text-sm transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      ❓ Помощь
                    </Link>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-medium transition-colors"
                      onClick={async () => {
                        // Clear local storage
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("token");
                        }
                        // Call API to clear cookies
                        await fetch("/api/logout", {
                          method: "POST",
                          credentials: "include",
                        });
                        window.location.href = "/login";
                      }}
                    >
                      🚪 Выйти
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-5 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              >
                Вход
              </Link>
              <Link href="/register" className="btn btn-primary">
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
