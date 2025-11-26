import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token) as { username: string };
    const user = await prisma.user.findUnique({
      where: { username: payload.username },
      select: { privacySettings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Default settings if null
    const defaultSettings = {
      profileVisibility: "EVERYONE",
      basicInfoVisibility: "EVERYONE",
      groupsVisibility: "EVERYONE",
      giftsVisibility: "EVERYONE",
      postsVisibility: "EVERYONE",
      commentsVisibility: "EVERYONE",
      wallPosting: "FRIENDS",
      photosVisibility: "EVERYONE",
      tagging: "FRIENDS",
      messages: "EVERYONE",
      calls: "FRIENDS",
      invites: "EVERYONE",
      appsInvites: "EVERYONE",
    };

    return NextResponse.json({
      ...defaultSettings,
      ...(user.privacySettings as object),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token) as { username: string };
    const data = await req.json();

    // Validate data (basic check)
    const allowedKeys = [
      "profileVisibility",
      "basicInfoVisibility",
      "groupsVisibility",
      "giftsVisibility",
      "postsVisibility",
      "commentsVisibility",
      "wallPosting",
      "photosVisibility",
      "tagging",
      "messages",
      "calls",
      "invites",
      "appsInvites",
    ];

    const cleanData: any = {};
    for (const key of allowedKeys) {
      if (data[key]) {
        cleanData[key] = data[key];
      }
    }

    await prisma.user.update({
      where: { username: payload.username },
      data: {
        privacySettings: cleanData,
      },
    });

    return NextResponse.json({ success: true, settings: cleanData });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
