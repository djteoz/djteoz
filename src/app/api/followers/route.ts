import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json([]);
    }

    let username;
    try {
      const payload = verifyAccessToken(token) as { username: string };
      username = payload.username;
    } catch (e) {
      return NextResponse.json([]);
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        friends: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    // For now, return friends as followers since we don't have a separate relation
    const followers = user.friends.map((friend: any) => ({
      username: friend.username,
      firstName: friend.firstName || "",
      lastName: friend.lastName || "",
      avatar: friend.avatar,
      bio: friend.bio || "",
    }));

    return NextResponse.json(followers);
  } catch (error) {
    console.error("Followers API error:", error);
    return NextResponse.json([]);
  }
}
