import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        avatar: true,
        cover: true,
        firstName: true,
        lastName: true,
        bio: true,
        city: true,
        country: true,
        birthday: true,
        website: true,
        phone: true,
        gender: true,
        work: true,
        education: true,
        languages: true,
        isPublic: true,
        createdAt: true,
        profileViews: true, // Include profileViews in the response
        role: true,
        isBanned: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Increment profile views
    await prisma.user.update({
      where: { username },
      data: { profileViews: { increment: 1 } },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyAccessToken(token) as { username: string };
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      bio,
      city,
      country,
      birthday,
      website,
      phone,
      gender,
      isPublic,
      email,
      language,
      privacySettings,
      notificationSettings,
      themeSettings,
    } = body;

    const updatedUser = await prisma.user.update({
      where: { username: payload.username },
      data: {
        firstName,
        lastName,
        bio,
        city,
        country,
        birthday,
        website,
        phone,
        gender,
        isPublic,
        email,
        language,
        privacySettings,
        notificationSettings,
        themeSettings,
      },
      select: {
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        city: true,
        country: true,
        birthday: true,
        website: true,
        phone: true,
        gender: true,
        isPublic: true,
        language: true,
        privacySettings: true,
        notificationSettings: true,
        themeSettings: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
