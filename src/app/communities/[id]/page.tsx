import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/db";
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../../lib/jwt";
import CommunityClient from "./community-client";
import CommunityFeed from "./community-feed";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Get Current User
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let currentUserId: string | null = null;
  let currentUserUsername: string | null = null;
  let currentUserAvatar: string | null = null;
  let currentUserName: string | null = null;

  if (token) {
    try {
      const payload = verifyAccessToken(token) as { username: string };
      currentUserUsername = payload.username;
      const user = await prisma.user.findUnique({
        where: { username: payload.username },
      });
      if (user) {
        currentUserId = user.id;
        currentUserAvatar = user.avatar;
        currentUserName = user.firstName
          ? `${user.firstName} ${user.lastName}`
          : user.username;
      }
    } catch (e) {}
  }

  // 2. Get Community Details
  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: currentUserId || "" },
      },
    },
  });

  if (!community) {
    notFound();
  }

  const isMember = community.members.length > 0;
  const userRole = isMember ? community.members[0].role : null;

  // 2.1 Get Subscribers (Latest 6)
  const subscribers = await prisma.communityMember.findMany({
    where: { communityId: id },
    take: 6,
    orderBy: { joinedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  // 2.2 Get Contacts (Admins & Owners)
  const contacts = await prisma.communityMember.findMany({
    where: {
      communityId: id,
      role: { in: ["OWNER", "ADMIN"] },
    },
    orderBy: { role: "desc" }, // OWNER comes before ADMIN usually if alphabetical, but let's see. OWNER > ADMIN.
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  // 3. Get Community Posts
  const posts = await prisma.post.findMany({
    where: { communityId: id },
    include: {
      author: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      comments: {
        take: 3,
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { username: true, avatar: true },
          },
        },
      },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedPosts = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    comments: post.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 pb-20">
      {/* Cover & Header */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="h-48 md:h-64 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          {community.cover && (
            <img
              src={community.cover}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-4 gap-4">
            <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg z-10">
              <div className="w-full h-full rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-4xl">
                {community.avatar ? (
                  <img
                    src={community.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>👥</span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-2 md:pt-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                {community.name}
                {["OWNER", "ADMIN"].includes(userRole || "") && (
                  <a
                    href={`/communities/${id}/settings`}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Настройки сообщества"
                  >
                    ⚙️
                  </a>
                )}
              </h1>
              <p className="text-gray-500">
                {community.category || "Сообщество"}
              </p>
            </div>

            {/* Client Component for Actions */}
            <div className="hidden md:block">
              {/* We will render the button inside the client component but we need to position it here. 
                   However, since we can't easily portal from a server component child to here without complex layout,
                   we will just render the client component here for the button, and another instance for the post form?
                   Or better: The client component handles the state and renders the button.
               */}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {community.description}
            </p>
            <div className="mt-4 flex gap-6 text-sm text-gray-500">
              <span>
                <strong className="text-gray-900">
                  {community.membersCount}
                </strong>{" "}
                участников
              </span>
              {community.website && (
                <a
                  href={community.website}
                  target="_blank"
                  className="text-indigo-600 hover:underline"
                >
                  {community.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Component: Join Button (Mobile/Desktop) & Create Post Form */}
          <CommunityClient
            communityId={id}
            isMember={isMember}
            userRole={userRole}
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            currentUserName={currentUserName}
          />

          {/* Posts Feed */}
          <CommunityFeed
            initialPosts={serializedPosts}
            currentUserUsername={currentUserUsername}
            userRole={userRole}
          />
        </div>

        {/* Right Column: Info Blocks */}
        <div className="space-y-6">
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900">Подписчики</h3>
              <span className="text-gray-500 text-sm">
                {community.membersCount}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {subscribers.map((member) => (
                <a
                  key={member.id}
                  href={`/profile/${member.user.username}`}
                  className="aspect-square rounded-full bg-gray-200 overflow-hidden relative group"
                  title={`${member.user.firstName} ${member.user.lastName}`}
                >
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-500">
                      {member.user.firstName?.[0] || member.user.username[0]}
                    </div>
                  )}
                </a>
              ))}
              {subscribers.length === 0 && (
                <div className="col-span-4 text-sm text-gray-500 text-center py-4">
                  Нет подписчиков
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-bold text-gray-900 mb-3">Контакты</h3>
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3">
                  <a
                    href={`/profile/${contact.user.username}`}
                    className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0"
                  >
                    {contact.user.avatar ? (
                      <img
                        src={contact.user.avatar}
                        alt={contact.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-indigo-500">
                        {contact.user.firstName?.[0] ||
                          contact.user.username[0]}
                      </div>
                    )}
                  </a>
                  <div className="min-w-0">
                    <a
                      href={`/profile/${contact.user.username}`}
                      className="font-medium text-sm text-gray-900 hover:text-indigo-600 truncate block"
                    >
                      {contact.user.firstName
                        ? `${contact.user.firstName} ${contact.user.lastName}`
                        : contact.user.username}
                    </a>
                    <div className="text-xs text-gray-500">
                      {contact.role === "OWNER" ? "Владелец" : "Администратор"}
                    </div>
                  </div>
                </div>
              ))}
              {contacts.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  Нет контактов
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
