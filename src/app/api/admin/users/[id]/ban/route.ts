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

    if (
      !currentUser ||
      (currentUser.role !== "ADMIN" && currentUser.role !== "OWNER")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { isBanned } = await req.json();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protection: Admin cannot ban Owner. Admin cannot ban other Admin (optional, but good practice).
    if (targetUser.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot ban the Owner" },
        { status: 403 }
      );
    }

    if (targetUser.role === "ADMIN" && currentUser.role !== "OWNER") {
      return NextResponse.json(
        { error: "Admins cannot ban other Admins" },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id },
      data: { isBanned },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
