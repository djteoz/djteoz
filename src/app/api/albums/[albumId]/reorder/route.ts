import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/db";
import { verifyAccessToken } from "../../../../../lib/jwt";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { albumId } = await params;
    const { photoIds } = await req.json();

    if (!Array.isArray(photoIds)) {
      return NextResponse.json(
        { error: "Invalid photoIds format" },
        { status: 400 }
      );
    }

    // Verify ownership of the album
    const album = await prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    if (album.creatorId !== (payload as any).userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update order in a transaction
    await prisma.$transaction(
      photoIds.map((id, index) =>
        prisma.photo.update({
          where: { id, albumId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering photos:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
