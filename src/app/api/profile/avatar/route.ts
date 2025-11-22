import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { users } from "../../../users";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !users[token]) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }
  const data = await req.formData();
  const file = data.get("avatar") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Нет файла" }, { status: 400 });
  }
  // Сохраняем файл на диск (uploads/)
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filename = `${token}_${Date.now()}_${file.name}`.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);
  users[token].avatar = filename;
  return NextResponse.json({ ok: true, avatar: filename });
}
