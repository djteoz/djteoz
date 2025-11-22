import React from "react";

async function getApps() {
  const res = await fetch("/api/apps", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return [];
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return [];
  return res.json();
}

export default async function AppsPage() {
  const apps = await getApps();
  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Приложения</h1>
      <div className="flex flex-col gap-2">
        {apps.map((app: any) => (
          <div key={app.id} className="card p-2">
            <h3 className="font-bold">{app.name}</h3>
            <p>{app.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
