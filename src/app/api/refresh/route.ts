import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { verifyRefreshToken, signAccessToken } from "../../../lib/jwt";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh_token")?.value;
  if (!refresh) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }
  try {
    const payload = verifyRefreshToken(refresh) as any;
    const accessToken = signAccessToken({ username: payload.username });

    const response = NextResponse.json({ ok: true, accessToken });
    response.cookies.set("token", accessToken, {
      httpOnly: false,
      maxAge: 60 * 15,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }
}
