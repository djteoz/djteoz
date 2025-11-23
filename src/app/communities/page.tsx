import React from "react";
import Link from "next/link";
import { prisma } from "../../lib/db";
import CommunitySearch from "./community-search";
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../lib/jwt";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    type?: string;
    filter?: string;
  }>;
}) {
  const { q, sort, type, filter } = await searchParams;

  // Get current user for "managed" filter
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const payload = verifyAccessToken(token) as { username: string };
      const user = await prisma.user.findUnique({
        where: { username: payload.username },
      });
      if (user) currentUserId = user.id;
    } catch (e) {}
  }

  // Build query
  const where: any = {};

  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }

  if (type) {
    where.type = type;
  }

  if (filter === "managed" && currentUserId) {
    where.members = {
      some: {
        userId: currentUserId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    };
  }

  const orderBy: any = {};
  if (sort === "new") {
    orderBy.createdAt = "desc";
  } else {
    orderBy.membersCount = "desc"; // Default popular
  }

  const communities = await prisma.community.findMany({
    where,
    orderBy,
    take: 20,
  });

  // Count managed communities for sidebar badge
  let managedCount = 0;
  if (currentUserId) {
    managedCount = await prisma.community.count({
      where: {
        members: {
          some: {
            userId: currentUserId,
            role: { in: ["OWNER", "ADMIN"] },
          },
        },
      },
    });
  }

  return (
    <main className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <CommunitySearch />

          {/* Recently Visited (Horizontal Scroll) */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 px-1">
              Недавно посещали
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {communities.slice(0, 4).map((c) => (
                <Link
                  href={`/communities/${c.id}`}
                  key={c.id}
                  className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-all border-2 border-white overflow-hidden">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👥</span>
                    )}
                  </div>
                  <span className="text-xs text-center text-gray-600 truncate w-20 group-hover:text-indigo-600">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Communities List */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">
                {filter === "managed"
                  ? "Управление сообществами"
                  : type === "event"
                  ? "Мероприятия"
                  : "Все сообщества"}{" "}
                <span className="text-gray-400 font-normal ml-1">
                  {communities.length}
                </span>
              </h2>
              <div className="flex gap-2 text-sm">
                <Link
                  href="/communities?sort=popular"
                  className={`font-medium ${
                    !sort || sort === "popular"
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Популярные
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/communities?sort=new"
                  className={`font-medium ${
                    sort === "new"
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Новые
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {communities.map((community) => (
                <Link
                  href={`/communities/${community.id}`}
                  key={community.id}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                    {community.avatar ? (
                      <img
                        src={community.avatar}
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>👥</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {community.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {community.description || "Нет описания"}
                    </p>
                    <div className="text-xs text-gray-400 mt-1">
                      {community.membersCount.toLocaleString()} участников
                    </div>
                  </div>
                  <button className="btn bg-gray-100 text-indigo-600 hover:bg-indigo-100 py-1.5 px-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Вступить
                  </button>
                </Link>
              ))}

              {communities.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Сообществ не найдено
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-4">
          <Link
            href="/communities/create"
            className="btn btn-primary w-full py-2.5 shadow-lg shadow-indigo-200 block text-center"
          >
            + Создать сообщество
          </Link>

          <div className="card p-2">
            <div className="flex flex-col">
              <Link
                href="/communities"
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  !filter && !type
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>Главная</span>
              </Link>
              <Link
                href="/communities?filter=managed"
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === "managed"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>Управление</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {managedCount}
                </span>
              </Link>
              <Link
                href="/communities?type=event"
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  type === "event"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>Мероприятия</span>
              </Link>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
              Популярное
            </h3>
            <div className="space-y-3">
              {communities.slice(0, 3).map((c) => (
                <Link
                  href={`/communities/${c.id}`}
                  key={c.id}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600">
                      {c.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {c.membersCount} subs
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                    +
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
