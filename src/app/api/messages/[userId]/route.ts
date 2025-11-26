import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../../../lib/jwt";
import { prisma } from "../../../../lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: otherUsername } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const currentUsername = payload.username;

    if (currentUsername === otherUsername) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { username: currentUsername },
    });

    const otherUser = await prisma.user.findUnique({
      where: { username: otherUsername },
    });

    if (!currentUser || !otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Получить все сообщения между двумя пользователями
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: otherUser.id },
          { senderId: otherUser.id, receiverId: currentUser.id },
        ],
      },
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Отметить все сообщения от собеседника как прочитанные
    await prisma.message.updateMany({
      where: {
        senderId: otherUser.id,
        receiverId: currentUser.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({
      messages: messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender.username,
        recipient: msg.receiver.username,
        text: msg.content,
        attachmentUrl: msg.attachmentUrl,
        attachmentType: msg.attachmentType,
        attachmentName: msg.attachmentName,
        createdAt: msg.createdAt,
        read: msg.read,
      })),
      otherUser: {
        username: otherUser.username,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        avatar: otherUser.avatar,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// Пометить диалог как прочитанный
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: otherUsername } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const currentUsername = payload.username;

    const currentUser = await prisma.user.findUnique({
      where: { username: currentUsername },
    });

    const otherUser = await prisma.user.findUnique({
      where: { username: otherUsername },
    });

    if (!currentUser || !otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Отметить все входящие сообщения от otherUser как прочитанные
    await prisma.message.updateMany({
      where: {
        senderId: otherUser.id,
        receiverId: currentUser.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
