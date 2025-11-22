import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("token");
  response.cookies.delete("refresh_token");
  return response;
}
