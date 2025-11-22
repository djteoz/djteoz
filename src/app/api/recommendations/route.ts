import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let currentUserId = null;

    if (token) {
      try {
        const payload = verifyAccessToken(token) as { username: string };
        const user = await prisma.user.findUnique({
          where: { username: payload.username },
          include: { friends: { select: { id: true } } },
        });
        if (user) currentUserId = user.id;
      } catch (e) {
        // ignore
      }
    }

    // Find users who are NOT friends and NOT me
    // Simple recommendation: random users or users with most followers (friends count)
    // For now, just random users excluding friends

    let excludeIds: string[] = [];
    if (currentUserId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { friends: { select: { id: true } } },
      });
      if (currentUser) {
        excludeIds = [
          currentUserId,
          ...currentUser.friends.map((f: any) => f.id),
        ];
      }
    }

    const recommendedUsers = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
      },
      take: 5,
      orderBy: {
        createdAt: "desc", // Just new users for now, or could be random
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        _count: {
          select: { friends: true },
        },
      },
    });

    return NextResponse.json(
      recommendedUsers.map((u: any) => ({
        id: u.id,
        username: u.username,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
        avatar: u.avatar,
        followersCount: u._count.friends,
      }))
    );
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
