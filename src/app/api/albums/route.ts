import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export async function GET(req: NextRequest) {
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
    const user = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const albums = await prisma.album.findMany({
      where: { creatorId: user.id },
      include: {
        _count: {
          select: { photos: true },
        },
        photos: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { url: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedAlbums = albums.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description,
      cover: album.cover || album.photos[0]?.url || null,
      count: album._count.photos,
      isSystem: album.isSystem,
      createdAt: album.createdAt,
    }));

    return NextResponse.json({ albums: formattedAlbums });
  } catch (error) {
    console.error("Albums API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
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

    const { title, description, privacy } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const album = await prisma.album.create({
      data: {
        title,
        description,
        privacy: privacy || "PUBLIC",
        creatorId: user.id,
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error("Create album error:", error);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 }
    );
  }
}
