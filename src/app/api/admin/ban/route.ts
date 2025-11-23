import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token) as { username: string };

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { username, action } = await req.json();

    if (!username || !["ban", "unban"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Prevent banning self
    if (username === requester.username) {
      return NextResponse.json(
        { error: "Cannot ban yourself" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        isBanned: action === "ban",
      },
    });

    return NextResponse.json({
      success: true,
      isBanned: updatedUser.isBanned,
    });
  } catch (error) {
    console.error("Ban error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
