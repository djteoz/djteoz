import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, secret } = await req.json();

    // Simple protection
    if (secret !== "admin-setup-secret-123") {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { username },
      data: { role: "ADMIN" },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
