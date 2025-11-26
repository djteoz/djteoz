import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'posts', 'photos', 'videos', 'communities', 'users'
    const tag = searchParams.get("tag");

    let whereClause: any = { userId: user.id };

    if (type === "posts") whereClause.postId = { not: null };
    else if (type === "photos") whereClause.photoId = { not: null };
    else if (type === "videos") whereClause.videoId = { not: null };
    else if (type === "communities") whereClause.communityId = { not: null };
    else if (type === "users") whereClause.targetUserId = { not: null };

    if (tag) {
      whereClause.tags = { has: tag };
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      include: {
        post: {
          include: {
            author: {
              select: {
                username: true,
                avatar: true,
                firstName: true,
                lastName: true,
              },
            },
            community: { select: { name: true, slug: true, avatar: true } },
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            membersCount: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        photo: { select: { id: true, url: true, description: true } },
        video: {
          select: { id: true, title: true, url: true, thumbnail: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    return NextResponse.json(
      { error: "Failed to get bookmarks" },
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

    const { postId, communityId, targetUserId, photoId, videoId, tags } =
      await req.json();

    // Check if already exists
    // We need to construct the where clause carefully because we can't use OR with undefined values easily in findFirst
    // But we can check specifically for the type being added
    let whereCheck: any = { userId: user.id };
    if (postId) whereCheck.postId = postId;
    else if (communityId) whereCheck.communityId = communityId;
    else if (targetUserId) whereCheck.targetUserId = targetUserId;
    else if (photoId) whereCheck.photoId = photoId;
    else if (videoId) whereCheck.videoId = videoId;
    else
      return NextResponse.json(
        { error: "No target specified" },
        { status: 400 }
      );

    const existing = await prisma.bookmark.findFirst({
      where: whereCheck,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already bookmarked" },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        postId,
        communityId,
        targetUserId,
        photoId,
        videoId,
        tags: tags || [],
      },
    });

    return NextResponse.json({ ok: true, bookmark }, { status: 201 });
  } catch (error) {
    console.error("Create bookmark error:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
