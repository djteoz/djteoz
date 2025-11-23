import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";
import SettingsClient from "./settings-client";
import Link from "next/link";

export default async function CommunitySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user;
  try {
    const payload = verifyAccessToken(token) as { username: string };
    user = await prisma.user.findUnique({
      where: { username: payload.username },
    });
  } catch (e) {
    redirect("/login");
  }

  if (!user) redirect("/login");

  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!community) notFound();

  const member = community.members[0];
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    redirect(`/communities/${id}`);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/communities/${id}`}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Управление сообществом
          </h1>
          <p className="text-gray-500">{community.name}</p>
        </div>
      </div>

      <SettingsClient
        community={{
          id: community.id,
          name: community.name,
          description: community.description,
          avatar: community.avatar,
          cover: community.cover,
          category: community.category,
          website: community.website,
          type: community.type,
        }}
        currentUserRole={member.role}
      />
    </main>
  );
}
