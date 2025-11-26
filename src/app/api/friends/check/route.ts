import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("token")?.value;

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const currentUsername = payload.username;

    const { searchParams } = new URL(req.url);
    const targetUsername = searchParams.get("username");

    if (!targetUsername) {
      return NextResponse.json(
        { error: "Target username required" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: {
        friends: {
          where: { username: targetUsername },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isFriend = currentUser.friends.length > 0;

    if (isFriend) {
      return NextResponse.json({ status: "friends" });
    }

    // Check for friend requests
    const sentRequest = await prisma.friendRequest.findFirst({
      where: {
        sender: { username: currentUsername },
        receiver: { username: targetUsername },
        status: "PENDING",
      },
    });

    if (sentRequest) {
      return NextResponse.json({ status: "request_sent" });
    }

    const receivedRequest = await prisma.friendRequest.findFirst({
      where: {
        sender: { username: targetUsername },
        receiver: { username: currentUsername },
        status: "PENDING",
      },
    });

    if (receivedRequest) {
      return NextResponse.json({ status: "request_received" });
    }

    return NextResponse.json({ status: "none" });
  } catch (error) {
    console.error("Check friend status error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
