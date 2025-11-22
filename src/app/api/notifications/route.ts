import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../../lib/jwt";
import { prisma } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  let token = cookieStore.get("token")?.value;

  // Если токена в cookies нет, проверим Authorization header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Убираем "Bearer "
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token) as { username: string };
    const username = payload.username;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Получить уведомления пользователя
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to 100
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    // Map to match the expected frontend format if needed, or just return as is
    // The frontend expects: fromUserAvatar.
    // We need to fetch avatar for fromUser.
    // Since fromUser is just a string in the schema, we might need to fetch those users.

    // Optimization: Fetch all unique fromUsers to get their avatars
    const fromUsernames = [
      ...new Set(notifications.map((n: any) => n.fromUser)),
    ];
    const fromUsers = await prisma.user.findMany({
      where: { username: { in: fromUsernames } },
      select: { username: true, avatar: true },
    });

    const avatarMap = fromUsers.reduce(
      (acc: Record<string, string | null>, u: any) => {
        acc[u.username] = u.avatar;
        return acc;
      },
      {} as Record<string, string | null>
    );

    const enrichedNotifications = notifications.map((n: any) => ({
      ...n,
      fromUserAvatar: avatarMap[n.fromUser] || null,
      createdAt: n.createdAt.toISOString(), // Ensure string format
      updatedAt: n.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: enrichedNotifications,
      unreadCount,
    });
  } catch (e) {
    console.error("Notifications error:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  let token = cookieStore.get("token")?.value;

  // Если токена в cookies нет, проверим Authorization header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token) as { username: string };
    const username = payload.username;

    const currentUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const { targetUser, type, content, postId } = await req.json();

    if (!targetUser || !type) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля" },
        { status: 400 }
      );
    }

    const targetUserObj = await prisma.user.findUnique({
      where: { username: targetUser },
    });

    if (!targetUserObj) {
      return NextResponse.json(
        { error: "Целевой пользователь не найден" },
        { status: 404 }
      );
    }

    // Создать новое уведомление
    const notification = await prisma.notification.create({
      data: {
        type,
        fromUser: username,
        content: content || "",
        postId,
        userId: targetUserObj.id,
      },
    });

    return NextResponse.json({
      ok: true,
      notification: {
        ...notification,
        fromUserAvatar: currentUser.avatar,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("Create notification error:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
