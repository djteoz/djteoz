import React from "react";

async function getNews() {
  const res = await fetch("/api/news", {
    cache: "no-store",
    credentials: "include",
  });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return [];
  return res.json();
}

export default async function NewsPage() {
  const news = await getNews();
  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Новости</h1>
      <div className="flex flex-col gap-2">
        {news.map((item: any) => (
          <div key={item.id} className="card p-2">
            <h3 className="font-bold">{item.title}</h3>
            <p>{item.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
