import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../lib/jwt";
import { cookies } from "next/headers";
import cloudinary from "../../../lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      verifyAccessToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "lumina_uploads";

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      cloudinary.config().api_secret!
    );

    return NextResponse.json({
      timestamp,
      folder,
      signature,
      api_key: cloudinary.config().api_key,
      cloud_name: cloudinary.config().cloud_name,
    });
  } catch (error) {
    console.error("Signing failed:", error);
    return NextResponse.json({ error: "Signing failed" }, { status: 500 });
  }
}
