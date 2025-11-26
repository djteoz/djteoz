import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function GET(req: NextRequest) {
  try {
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

    const requests = await prisma.friendRequest.findMany({
      where: {
        receiver: { username },
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedRequests = requests.map((req) => ({
      id: req.id,
      username: req.sender.username,
      firstName: req.sender.firstName,
      lastName: req.sender.lastName,
      avatar: req.sender.avatar,
      bio: req.sender.bio,
      createdAt: req.createdAt,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Failed to fetch friend requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
