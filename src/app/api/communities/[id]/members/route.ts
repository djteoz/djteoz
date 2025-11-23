import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/db";
import { verifyAccessToken } from "../../../../../lib/jwt";

// GET: List members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await prisma.communityMember.findMany({
      where: { communityId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// PATCH: Update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token) as { username: string };
    const currentUser = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!currentUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check permissions
    const currentMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId: currentUser.id, communityId: id },
      },
    });

    if (!currentMember || currentMember.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only OWNER can manage roles" },
        { status: 403 }
      );
    }

    const { userId, role } = await req.json();

    if (!["ADMIN", "MODERATOR", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updatedMember = await prisma.communityMember.update({
      where: { userId_communityId: { userId, communityId: id } },
      data: { role },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE: Kick member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token) as { username: string };
    const currentUser = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!currentUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check permissions
    const currentMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId: currentUser.id, communityId: id },
      },
    });

    if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await req.json();

    // Prevent kicking self or owner
    const targetMember = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId: id } },
    });

    if (!targetMember)
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (targetMember.role === "OWNER")
      return NextResponse.json({ error: "Cannot kick owner" }, { status: 403 });

    // Admins cannot kick other admins (unless owner)
    if (currentMember.role === "ADMIN" && targetMember.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot kick other admins" },
        { status: 403 }
      );
    }

    await prisma.communityMember.delete({
      where: { userId_communityId: { userId, communityId: id } },
    });

    // Decrement members count
    await prisma.community.update({
      where: { id },
      data: { membersCount: { decrement: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to kick member" },
      { status: 500 }
    );
  }
}
