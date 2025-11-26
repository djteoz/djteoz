import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/db";
import { verifyAccessToken } from "../../../../../lib/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
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

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: user.id,
        photoId: photoId,
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
    });

    // Notify photo owner if it's not the same user
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (photo && photo.uploaderId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "photo_comment",
          fromUser: user.username,
          userId: photo.uploaderId,
          content: `${user.username} прокомментировал ваше фото`,
          read: false,
        },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
