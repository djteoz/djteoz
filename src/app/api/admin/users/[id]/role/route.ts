import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../../lib/db";
import { verifyAccessToken } from "../../../../../../lib/jwt";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token) as { username: string };
    const currentUser = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    // Only OWNER can change roles
    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only Owner can manage roles" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { role } = await req.json();

    if (!["USER", "ADMIN", "MODERATOR", "OWNER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent changing own role to something else (must transfer ownership first)
    if (currentUser.id === id && role !== "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove own ownership directly" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If promoting someone else to OWNER, demote current user to ADMIN?
    // The prompt says "Transfer rights". Usually this means 1 owner.
    // For simplicity, let's allow multiple owners or just role change.
    // If strict single owner:
    if (role === "OWNER" && currentUser.id !== id) {
       // Transaction: Promote target to OWNER, Demote current to ADMIN
       await prisma.$transaction([
         prisma.user.update({ where: { id }, data: { role: "OWNER" } }),
         prisma.user.update({ where: { id: currentUser.id }, data: { role: "ADMIN" } })
       ]);
       return NextResponse.json({ success: true, message: "Ownership transferred" });
    }

    await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
