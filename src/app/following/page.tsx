import React from "react";

async function getFollowing() {
  const res = await fetch("/api/following", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return [];
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return [];
  return res.json();
}

export default async function FollowingPage() {
  const following = await getFollowing();
  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Подписки</h1>
      <div className="flex flex-col gap-2">
        {following.map((f: any) => (
          <div key={f.id} className="card p-2">
            <span>@{f.username}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
