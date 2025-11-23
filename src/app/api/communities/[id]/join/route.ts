import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/db";
import { verifyAccessToken } from "../../../../../lib/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
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

    // Check if already a member
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: communityId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // Join community
    await prisma.$transaction([
      prisma.communityMember.create({
        data: {
          userId: user.id,
          communityId: communityId,
          role: "MEMBER",
        },
      }),
      prisma.community.update({
        where: { id: communityId },
        data: { membersCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Join community error:", error);
    return NextResponse.json(
      { error: "Failed to join community" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
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

    // Check if member
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: communityId,
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    // Leave community
    await prisma.$transaction([
      prisma.communityMember.delete({
        where: {
          userId_communityId: {
            userId: user.id,
            communityId: communityId,
          },
        },
      }),
      prisma.community.update({
        where: { id: communityId },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Leave community error:", error);
    return NextResponse.json(
      { error: "Failed to leave community" },
      { status: 500 }
    );
  }
}
