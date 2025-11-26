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

    const { action } = await req.json(); // 'like' or 'unlike'

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    let updatedLikes = [...photo.likes];

    if (action === "like") {
      if (!updatedLikes.includes(user.username)) {
        updatedLikes.push(user.username);

        // Notify owner
        if (photo.uploaderId !== user.id) {
          await prisma.notification.create({
            data: {
              type: "photo_like",
              fromUser: user.username,
              userId: photo.uploaderId,
              content: `${user.username} оценил ваше фото`,
              read: false,
            },
          });
        }
      }
    } else if (action === "unlike") {
      updatedLikes = updatedLikes.filter((u) => u !== user.username);
    }

    await prisma.photo.update({
      where: { id: photoId },
      data: { likes: updatedLikes },
    });

    return NextResponse.json({ likes: updatedLikes.length });
  } catch (error) {
    console.error("Like photo error:", error);
    return NextResponse.json(
      { error: "Failed to update like" },
      { status: 500 }
    );
  }
}
