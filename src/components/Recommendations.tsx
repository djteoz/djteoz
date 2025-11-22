"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Recommendations() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/recommendations", {
      credentials: "include",
    })
      .then(async (r) => {
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("application/json")) return [];
        return r.json();
      })
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  if (!items.length) return null;
  return (
    <div className="card mb-4">
      <h2 className="font-bold mb-2 text-lg">Рекомендации</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="font-medium">{item.title || item.name}</span>
            <Link
              href={item.link || "#"}
              className="ml-auto btn px-2 py-1 text-xs"
            >
              Подробнее
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
