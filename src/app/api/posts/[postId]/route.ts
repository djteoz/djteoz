import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
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
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: post.id,
      content: post.content,
      image_url: post.image,
      author: post.author.username,
      authorName:
        `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() ||
        post.author.username,
      authorAvatar: post.author.avatar,
      likes: post.likes,
      comments: post.comments.map(
        (c: {
          id: string;
          author: {
            username: string;
            firstName: string | null;
            lastName: string | null;
            avatar: string | null;
          };
          content: string;
          likes: string[];
          createdAt: Date;
        }) => ({
          id: c.id,
          author: c.author.username,
          authorName:
            `${c.author.firstName || ""} ${c.author.lastName || ""}`.trim() ||
            c.author.username,
          authorAvatar: c.author.avatar,
          text: c.content,
          likes: c.likes,
          createdAt: c.createdAt,
        })
      ),
      createdAt: post.createdAt,
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Failed to get post" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: { select: { username: true } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Только автор может удалить пост
    if (post.author.username !== username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId: postIdFromParams } = await params;
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

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, comment } = body;
    const postId = body.postId || postIdFromParams;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: { select: { id: true, username: true } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (action === "like") {
      // Проверить если уже лайкнул
      if (post.likes.includes(username)) {
        return NextResponse.json({ error: "Already liked" }, { status: 400 });
      }

      // Добавить лайк
      await prisma.post.update({
        where: { id: postId },
        data: {
          likes: {
            push: username,
          },
        },
      });

      // Создать уведомление для автора поста
      if (post.author.username !== username) {
        await prisma.notification.create({
          data: {
            type: "post_like",
            fromUser: username,
            userId: post.author.id,
            content: `${username} понравился ваш пост`,
            postId: postId,
            read: false,
          },
        });
      }

      return NextResponse.json({
        ok: true,
        action: "liked",
        likes: [...post.likes, username],
      });
    } else if (action === "unlike") {
      // Проверить если не лайкнул
      if (!post.likes.includes(username)) {
        return NextResponse.json({ error: "Not liked" }, { status: 400 });
      }

      // Удалить лайк
      await prisma.post.update({
        where: { id: postId },
        data: {
          likes: {
            set: post.likes.filter((u: string) => u !== username),
          },
        },
      });

      return NextResponse.json({
        ok: true,
        action: "unliked",
        likes: post.likes.filter((u: string) => u !== username),
      });
    } else if (action === "view") {
      await prisma.post.update({
        where: { id: postId },
        data: {
          views: {
            increment: 1,
          },
        },
      });
      return NextResponse.json({ ok: true });
    } else if (action === "comment") {
      if (!comment || comment.trim().length === 0) {
        return NextResponse.json(
          { error: "Comment text is required" },
          { status: 400 }
        );
      }

      if (comment.length > 1000) {
        return NextResponse.json(
          { error: "Comment is too long (max 1000 characters)" },
          { status: 400 }
        );
      }

      const newComment = await prisma.comment.create({
        data: {
          content: comment.trim(),
          authorId: user.id,
          postId: postId,
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

      // Создать уведомление для автора поста
      if (post.author.username !== username) {
        await prisma.notification.create({
          data: {
            type: "comment",
            fromUser: username,
            userId: post.author.id,
            content: `${username} прокомментировал ваш пост`,
            postId: postId,
            read: false,
          },
        });
      }

      return NextResponse.json(
        {
          ok: true,
          action: "commented",
          comment: {
            id: newComment.id,
            author: newComment.author.username,
            authorName:
              `${newComment.author.firstName || ""} ${
                newComment.author.lastName || ""
              }`.trim() || newComment.author.username,
            authorAvatar: newComment.author.avatar,
            text: newComment.content,
            likes: [],
            createdAt: newComment.createdAt,
          },
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Post interaction error:", error);
    return NextResponse.json(
      { error: "Failed to interact with post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: { select: { username: true } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Только автор может редактировать пост
    if (post.author.username !== username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { content } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Post content is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: content.trim(),
      },
    });

    return NextResponse.json({
      ok: true,
      post: {
        id: updatedPost.id,
        content: updatedPost.content,
      },
    });
  } catch (error) {
    console.error("Edit post error:", error);
    return NextResponse.json({ error: "Failed to edit post" }, { status: 500 });
  }
}
