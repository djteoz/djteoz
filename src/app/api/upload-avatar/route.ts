import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../../lib/jwt";
import { prisma } from "../../../lib/db";

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
    const username = payload.username;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ВАЖНО: На Vercel файловая система доступна только для чтения (кроме /tmp).
    // Сохранение в public/uploads НЕ БУДЕТ работать в продакшене.
    // Для полноценного решения нужно использовать Vercel Blob, AWS S3 или Cloudinary.
    // В качестве временного решения для демо мы сохраним изображение как Base64 строку прямо в БД (не рекомендуется для больших файлов).

    // Проверка размера (макс 2МБ для base64)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 2MB)" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Обновляем профиль пользователя, сохраняя Data URL в поле avatar
    // Примечание: Поле avatar в схеме String, оно может вместить большие строки (Text в Postgres).
    await prisma.user.update({
      where: { username },
      data: { avatar: dataUrl }, // Сохраняем саму картинку, а не путь
    });

    return NextResponse.json({ ok: true, avatar: dataUrl });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
