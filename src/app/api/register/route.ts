import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { signAccessToken, signRefreshToken } from "../../../lib/jwt";

export async function POST(req: NextRequest) {
  const {
    username,
    password,
    email,
    bio,
    firstName,
    lastName,
    phone,
    website,
    birthday,
    gender,
    city,
    country,
    interests,
    isPublic,
  } = await req.json();
  // Валидация
  if (!username || !password || !email) {
    return NextResponse.json(
      { error: "Заполните все обязательные поля" },
      { status: 400 }
    );
  }
  if (!/^[a-zA-Z0-9_\-.]{3,20}$/.test(username)) {
    return NextResponse.json({ error: "Некорректный логин" }, { status: 400 });
  }
  if (password.length < 3) {
    return NextResponse.json(
      { error: "Пароль слишком короткий (минимум 3 символа)" },
      { status: 400 }
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }
  if (phone && !/^\+?\d{7,15}$/.test(phone)) {
    return NextResponse.json(
      { error: "Некорректный телефон" },
      { status: 400 }
    );
  }
  if (website && !/^https?:\/\//.test(website)) {
    return NextResponse.json(
      { error: "Некорректный сайт (должен начинаться с http:// или https://)" },
      { status: 400 }
    );
  }
  if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return NextResponse.json(
      { error: "Дата рождения в формате ГГГГ-ММ-ДД" },
      { status: 400 }
    );
  }
  // Проверка существования пользователя
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: username }, { email: email }],
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Пользователь уже существует" },
      { status: 409 }
    );
  }

  // Создаём пользователя в БД (TODO: использовать bcrypt для пароля)
  const newUser = await prisma.user.create({
    data: {
      username,
      password,
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      bio: bio || "",
      phone: phone || "",
      gender: gender || "other",
      birthday: birthday || "",
      city: city || "",
      country: country || "",
      website: website || "",
      isPublic: !!isPublic,
    },
  });
  // Сразу логиним
  const accessToken = signAccessToken({ username });
  const refreshToken = signRefreshToken({ username });
  const response = NextResponse.json({ ok: true, accessToken });
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  response.cookies.set("token", accessToken, {
    httpOnly: false,
    maxAge: 60 * 15,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
