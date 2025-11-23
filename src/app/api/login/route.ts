import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { signAccessToken, signRefreshToken } from "../../../lib/jwt";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  console.log("[DEBUG LOGIN] Attempting login:", { username });

  if (!username || !password) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }

  // Ищем по username или email
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ username: username }, { email: username }],
    },
  });
  let realUsername = username;

  if (!user) {
    console.log("[DEBUG LOGIN] User not found:", { username });
    return NextResponse.json(
      { error: "Неверный логин или пароль" },
      { status: 401 }
    );
  }

  if (user.isBanned) {
    return NextResponse.json(
      { error: "Ваш аккаунт заблокирован администрацией." },
      { status: 403 }
    );
  }

  // Сравнение паролей (TODO: использовать bcrypt в продакшене)
  const isMatch = user?.password === password;

  console.log("[DEBUG LOGIN] Password check:", {
    expectedPassword: user.password,
    providedPassword: password,
    match: isMatch,
  });

  if (!isMatch) {
    console.log("[DEBUG LOGIN] Password mismatch for user:", {
      username: realUsername,
    });
    return NextResponse.json(
      { error: "Неверный логин или пароль" },
      { status: 401 }
    );
  }

  // Определяем username для токена
  realUsername = user?.username || username;
  const accessToken = signAccessToken({ username: realUsername });
  const refreshToken = signRefreshToken({ username: realUsername });

  console.log("[DEBUG LOGIN] Success! Creating response with tokens:", {
    username: realUsername,
    accessTokenLength: accessToken.length,
    refreshTokenLength: refreshToken.length,
  });

  const response = NextResponse.json({ ok: true, accessToken });
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  response.cookies.set("token", accessToken, {
    httpOnly: false, // чтобы был доступен клиенту и серверу
    maxAge: 60 * 15,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  console.log("[DEBUG LOGIN] Response cookies set. Headers:", {
    setCookie: response.headers.get("set-cookie"),
  });

  return response;
}
