"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function FriendsSuggestions() {
  const [friends, setFriends] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/friends/suggestions", {
      credentials: "include",
    })
      .then(async (r) => {
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("application/json")) return [];
        return r.json();
      })
      .then(setFriends)
      .catch(() => setFriends([]));
  }, []);
  if (!friends.length) return null;
  return (
    <div className="card mb-4">
      <h2 className="font-bold mb-2 text-lg">Возможные друзья</h2>
      <ul className="flex flex-col gap-2">
        {friends.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
            <img
              src={f.avatar ? `/uploads/${f.avatar}` : "/default-avatar.png"}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium">@{f.username}</span>
            <Link
              href={`/profile/${f.username}`}
              className="ml-auto btn px-2 py-1 text-xs"
            >
              Добавить
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
