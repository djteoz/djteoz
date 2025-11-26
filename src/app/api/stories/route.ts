import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let currentUserId = null;

    if (token) {
      try {
        const payload = verifyAccessToken(token) as { username: string };
        const user = await prisma.user.findUnique({
          where: { username: payload.username },
        });
        if (user) currentUserId = user.id;
      } catch (e) {
        // ignore
      }
    }

    // Fetch stories from last 24 hours
    const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

    const stories = await prisma.story.findMany({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
      include: {
        author: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by user
    const storiesByUser: Record<string, any> = {};

    stories.forEach((story: any) => {
      if (!storiesByUser[story.author.username]) {
        storiesByUser[story.author.username] = {
          username: story.author.username,
          name:
            `${story.author.firstName || ""} ${
              story.author.lastName || ""
            }`.trim() || story.author.username,
          avatar: story.author.avatar,
          items: [],
        };
      }
      storiesByUser[story.author.username].items.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        type: story.type,
        createdAt: story.createdAt,
      });
    });

    return NextResponse.json(Object.values(storiesByUser));
  } catch (error) {
    console.error("Stories API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const user = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { mediaUrl, type } = await req.json();

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Media URL is required" },
        { status: 400 }
      );
    }

    // Expires in 24 hours
    const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

    const story = await prisma.story.create({
      data: {
        authorId: user.id,
        mediaUrl,
        type: type || "image",
        expiresAt,
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error("Create story error:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };
    const user = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.story.deleteMany({
      where: { authorId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete all stories error:", error);
    return NextResponse.json(
      { error: "Failed to delete stories" },
      { status: 500 }
    );
  }
}
