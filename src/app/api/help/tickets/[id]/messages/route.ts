import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../../lib/db";
import { verifyAccessToken } from "../../../../../../lib/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { content } = await req.json();

    const message = await prisma.supportMessage.create({
      data: {
        content,
        ticketId: id,
        isStaff: false,
      },
    });

    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
