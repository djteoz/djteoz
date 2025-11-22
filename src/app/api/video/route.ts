import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: { username: true, firstName: true, lastName: true },
        },
      },
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload;
    try {
      payload = verifyAccessToken(token) as { username: string };
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { username: payload.username },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { title, description, url, thumbnail } = await req.json();

    if (!title || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        url,
        thumbnail,
        uploaderId: user.id,
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error("Failed to create video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
