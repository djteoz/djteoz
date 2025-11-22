import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../../../lib/jwt";
import { prisma } from "../../../../lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
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

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const { notificationId } = await params;

    // Проверяем, принадлежит ли уведомление пользователю
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Уведомление не найдено" },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ ok: true, notification: updatedNotification });
  } catch (e) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
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

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const { notificationId } = await params;

    // Проверяем, принадлежит ли уведомление пользователю
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Уведомление не найдено" },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
