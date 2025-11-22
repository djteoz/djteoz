import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  let token = cookieStore.get("token")?.value;

  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const payload = verifyAccessToken(token) as { username: string };
    const username = payload.username;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({
      username: user.username,
      avatar: user.avatar,
      cover: user.cover,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      email: user.email,
      city: user.city,
      country: user.country,
      birthday: user.birthday,
      website: user.website,
      phone: user.phone,
      gender: user.gender,
      work: user.work,
      education: user.education,
      languages: user.languages,
      isPublic: user.isPublic,
      profileViews: user.profileViews,
      createdAt: user.createdAt,
    });
  } catch (e) {
    return NextResponse.json(null, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

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

    const {
      email,
      bio,
      firstName,
      lastName,
      phone,
      city,
      country,
      website,
      birthday,
      gender,
      cover,
      work,
      education,
      languages,
    } = await req.json();

    const updated = await prisma.user.update({
      where: { username },
      data: {
        ...(typeof email === "string" && { email }),
        ...(typeof bio === "string" && { bio }),
        ...(typeof firstName === "string" && { firstName }),
        ...(typeof lastName === "string" && { lastName }),
        ...(typeof phone === "string" && { phone }),
        ...(typeof city === "string" && { city }),
        ...(typeof country === "string" && { country }),
        ...(typeof website === "string" && { website }),
        ...(typeof birthday === "string" && { birthday }),
        ...(typeof gender === "string" && { gender }),
        ...(typeof cover === "string" && { cover }),
        ...(typeof work === "string" && { work }),
        ...(typeof education === "string" && { education }),
        ...(typeof languages === "string" && { languages }),
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    return NextResponse.json(
      { error: "Ошибка обновления профиля" },
      { status: 500 }
    );
  }
}
