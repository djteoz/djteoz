import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const lowerQuery = query.toLowerCase();

    // Prisma search
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
      },
      take: 20,
    });

    const results = users.map((user: any) => ({
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      avatar: user.avatar || null,
      bio: user.bio || "",
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
