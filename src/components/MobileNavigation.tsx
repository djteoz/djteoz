"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";

export function MobileNavigation() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ username: string; avatar?: string } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Load profile for avatar
    fetch("/api/profile")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setProfile(data))
      .catch(() => {});

    // Load unread messages
    const loadUnread = async () => {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          const total = (data.conversations || []).reduce(
            (sum: number, conv: any) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadMessages(total);
        }
      } catch (e) {}
    };
    loadUnread();
  }, []);

  const navItems = [
    { href: "/feed", label: "Лента", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
    )},
    { href: "/search", label: "Поиск", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )},
    { href: "/messages", label: "Чат", icon: (
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </span>
        )}
      </div>
    )},
    { href: "/menu", label: "Меню", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
    )},
  ];

  if (!profile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 lg:hidden z-50 pb-safe">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={`/profile/${profile.username}`}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            pathname === `/profile/${profile.username}` ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <div className={`rounded-full border-2 ${pathname === `/profile/${profile.username}` ? "border-indigo-600" : "border-transparent"}`}>
            <UserAvatar avatar={profile.avatar} name={profile.username} size={24} />
          </div>
          <span className="text-[10px] font-medium">Профиль</span>
        </Link>
      </div>
    </div>
  );
}
