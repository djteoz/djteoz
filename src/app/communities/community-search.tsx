"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CommunitySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.push(`/communities?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  return (
    <div className="card p-3 flex items-center gap-3">
      <span className="text-gray-400 pl-2">🔍</span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск сообществ"
        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400"
      />
      <button className="btn bg-gray-100 text-gray-600 hover:bg-gray-200 py-1.5 px-4 text-sm">
        Найти
      </button>
    </div>
  );
}
