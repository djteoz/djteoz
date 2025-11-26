import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../../lib/jwt";
import { prisma } from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const username = payload.username;

    const currentUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find all messages where current user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: currentUser.id }, { receiverId: currentUser.id }],
      },
      include: {
        sender: { select: { username: true, avatar: true } },
        receiver: { select: { username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation partner
    const conversationsMap = new Map<
      string,
      {
        partnerUsername: string;
        partnerAvatar: string | null;
        lastMessage: any;
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const isSender = msg.senderId === currentUser.id;
      const partner = isSender ? msg.receiver : msg.sender;
      const partnerUsername = partner.username;

      if (!conversationsMap.has(partnerUsername)) {
        conversationsMap.set(partnerUsername, {
          partnerUsername,
          partnerAvatar: partner.avatar,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      // Count unread messages sent TO current user
      if (!isSender && !msg.read) {
        const conv = conversationsMap.get(partnerUsername)!;
        conv.unreadCount++;
      }
    }

    const userConversations = Array.from(conversationsMap.values()).map(
      (conv) => ({
        id: [username, conv.partnerUsername].sort().join("-"), // Consistent ID
        otherUser: conv.partnerUsername,
        otherUserAvatar: conv.partnerAvatar,
        lastMessage: conv.lastMessage.content,
        lastMessageTime: conv.lastMessage.createdAt.toISOString(),
        unreadCount: conv.unreadCount,
      })
    );

    return NextResponse.json({ conversations: userConversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Failed to get conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const senderUsername = payload.username;

    const { recipient, text, attachmentUrl, attachmentType, attachmentName } =
      await req.json();

    if (!recipient || ((!text || text.trim().length === 0) && !attachmentUrl)) {
      return NextResponse.json(
        { error: "Recipient and content (text or attachment) are required" },
        { status: 400 }
      );
    }

    if (senderUsername === recipient) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 }
      );
    }

    const sender = await prisma.user.findUnique({
      where: { username: senderUsername },
    });

    const receiver = await prisma.user.findUnique({
      where: { username: recipient },
    });

    if (!sender || !receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Создать новое сообщение
    const message = await prisma.message.create({
      data: {
        content: text ? text.trim() : "",
        senderId: sender.id,
        receiverId: receiver.id,
        attachmentUrl,
        attachmentType,
        attachmentName,
      },
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } },
      },
    });

    // Format response to match expected frontend structure if needed
    // The frontend expects: id, sender, recipient, text, createdAt, read
    const formattedMessage = {
      id: message.id,
      sender: message.sender.username,
      recipient: message.receiver.username,
      text: message.content,
      attachmentUrl: message.attachmentUrl,
      attachmentType: message.attachmentType,
      attachmentName: message.attachmentName,
      createdAt: message.createdAt.toISOString(),
      read: message.read,
    };

    return NextResponse.json(
      { ok: true, message: formattedMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
