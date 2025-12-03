import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token) as { userId: string };
    const { name, description, slug } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if slug exists
    const existingShop = await prisma.shop.findUnique({
      where: { slug },
    });

    if (existingShop) {
      return NextResponse.json(
        { error: "Slug already taken" },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.create({
      data: {
        name,
        description,
        slug,
        ownerId: payload.userId,
      },
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
