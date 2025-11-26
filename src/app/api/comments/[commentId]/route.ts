import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
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
    const username = payload.username;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: { select: { username: true } },
        post: { include: { author: { select: { username: true } } } },
        photo: { include: { uploader: { select: { username: true } } } },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Автор комментария, автор поста или автор фото могут удалить комментарий
    const isCommentAuthor = comment.author.username === username;
    const isPostAuthor = comment.post?.author.username === username;
    const isPhotoAuthor = comment.photo?.uploader.username === username;

    if (!isCommentAuthor && !isPostAuthor && !isPhotoAuthor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
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
    const username = payload.username;

    const body = await req.json();
    const { action } = body;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (action === "like") {
      if (comment.likes.includes(username)) {
        return NextResponse.json({ error: "Already liked" }, { status: 400 });
      }

      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: {
            push: username,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        action: "liked",
        likes: [...comment.likes, username],
      });
    } else if (action === "unlike") {
      if (!comment.likes.includes(username)) {
        return NextResponse.json({ error: "Not liked" }, { status: 400 });
      }

      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: {
            set: comment.likes.filter((u: string) => u !== username),
          },
        },
      });

      return NextResponse.json({
        ok: true,
        action: "unliked",
        likes: comment.likes.filter((u: string) => u !== username),
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Comment interaction error:", error);
    return NextResponse.json(
      { error: "Failed to interact with comment" },
      { status: 500 }
    );
  }
}
