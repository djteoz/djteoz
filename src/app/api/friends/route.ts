import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

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
    const username = payload.username;

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friends = user.friends.map(
      (friend: {
        username: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        bio: string | null;
      }) => ({
        username: friend.username,
        firstName: friend.firstName || "",
        lastName: friend.lastName || "",
        avatar: friend.avatar,
        bio: friend.bio || "",
      })
    );

    return NextResponse.json({ friends });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get friends" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const currentUser = await prisma.user.findUnique({
      where: { username: currentUsername },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { action, username: targetUsername } = await req.json();

    if (!targetUsername) {
      return NextResponse.json(
        { error: "Target username required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    if (currentUsername === targetUsername) {
      return NextResponse.json(
        { error: "Cannot add yourself as friend" },
        { status: 400 }
      );
    }

    if (action === "add") {
      // Check if already friends
      const alreadyFriends = await prisma.user.findFirst({
        where: {
          username: currentUsername,
          friends: {
            some: { username: targetUsername },
          },
        },
      });

      if (alreadyFriends) {
        return NextResponse.json({ error: "Already friends" }, { status: 400 });
      }

      // Check if request already exists
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            {
              sender: { username: currentUsername },
              receiver: { username: targetUsername },
            },
            {
              sender: { username: targetUsername },
              receiver: { username: currentUsername },
            },
          ],
          status: "PENDING",
        },
      });

      if (existingRequest) {
        return NextResponse.json(
          { error: "Request already pending" },
          { status: 400 }
        );
      }

      // Create friend request
      await prisma.friendRequest.create({
        data: {
          sender: { connect: { username: currentUsername } },
          receiver: { connect: { username: targetUsername } },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          type: "friend_request",
          fromUser: currentUsername,
          userId: targetUser.id,
          content: `${currentUsername} отправил вам заявку в друзья`,
          read: false,
        },
      });

      return NextResponse.json({ ok: true, action: "request_sent" });
    } else if (action === "accept") {
      // Find pending request
      const request = await prisma.friendRequest.findFirst({
        where: {
          sender: { username: targetUsername },
          receiver: { username: currentUsername },
          status: "PENDING",
        },
      });

      if (!request) {
        return NextResponse.json(
          { error: "No pending request found" },
          { status: 404 }
        );
      }

      // Update request status
      await prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "ACCEPTED" },
      });

      // Add to friends (bidirectional)
      await prisma.user.update({
        where: { username: currentUsername },
        data: {
          friends: {
            connect: { username: targetUsername },
          },
        },
      });

      await prisma.user.update({
        where: { username: targetUsername },
        data: {
          friends: {
            connect: { username: currentUsername },
          },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          type: "friend_request_accepted",
          fromUser: currentUsername,
          userId: targetUser.id,
          content: `${currentUsername} принял вашу заявку в друзья`,
          read: false,
        },
      });

      return NextResponse.json({ ok: true, action: "accepted" });
    } else if (action === "reject" || action === "cancel") {
      // Find pending request (either direction depending on action)
      const request = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            {
              sender: { username: currentUsername },
              receiver: { username: targetUsername },
            },
            {
              sender: { username: targetUsername },
              receiver: { username: currentUsername },
            },
          ],
          status: "PENDING",
        },
      });

      if (request) {
        await prisma.friendRequest.delete({
          where: { id: request.id },
        });
      }

      return NextResponse.json({ ok: true, action: "cancelled" });
    } else if (action === "remove") {
      await prisma.user.update({
        where: { username: currentUsername },
        data: {
          friends: {
            disconnect: { username: targetUsername },
          },
        },
      });

      await prisma.user.update({
        where: { username: targetUsername },
        data: {
          friends: {
            disconnect: { username: currentUsername },
          },
        },
      });

      // Also remove any friend requests if they exist (cleanup)
      await prisma.friendRequest.deleteMany({
        where: {
          OR: [
            {
              sender: { username: currentUsername },
              receiver: { username: targetUsername },
            },
            {
              sender: { username: targetUsername },
              receiver: { username: currentUsername },
            },
          ],
        },
      });

      return NextResponse.json({ ok: true, action: "removed" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Friends API error:", error);
    return NextResponse.json(
      { error: "Failed to update friends" },
      { status: 500 }
    );
  }
}
