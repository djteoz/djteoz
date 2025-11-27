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
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "posts";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    let items = [];
    let total = 0;

    if (type === "music") {
      const where = query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { artist: { contains: query, mode: "insensitive" as const } },
              { uploader: { username: { contains: query, mode: "insensitive" as const } } },
            ],
          }
        : {};

      const [music, count] = await Promise.all([
        prisma.music.findMany({
          where,
          include: {
            uploader: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.music.count({ where }),
      ]);
      items = music;
      total = count;
    } else if (type === "video") {
      const where = query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
              { uploader: { username: { contains: query, mode: "insensitive" as const } } },
            ],
          }
        : {};

      const [videos, count] = await Promise.all([
        prisma.video.findMany({
          where,
          include: {
            uploader: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.video.count({ where }),
      ]);
      items = videos;
      total = count;
    } else {
      // Posts (default)
      const where = query
        ? {
            OR: [
              { content: { contains: query, mode: "insensitive" as const } },
              { author: { username: { contains: query, mode: "insensitive" as const } } },
            ],
          }
        : {};

      const [posts, count] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                comments: true,
                reports: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ]);
      items = posts;
      total = count;
    }

    return NextResponse.json({ items, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
