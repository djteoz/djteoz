import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

const SETUP_SECRET = "lumina-owner-secret-key-123";

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();

    if (secret !== SETUP_SECRET) {
      return NextResponse.json({ error: "Неверный секретный ключ" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Вы не авторизованы" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    
    const user = await prisma.user.update({
      where: { username: payload.username },
      data: { role: "OWNER" }
    });

    return NextResponse.json({ ok: true, role: user.role, message: `Пользователь ${user.username} теперь OWNER` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
