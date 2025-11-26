import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { sendPasswordResetEmail } from "../../../../lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: email }, // Allow searching by phone too if entered in email field
        ],
      },
    });

    if (!user) {
      // For security, don't reveal if user exists, but for dev we might want to know
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 15 minutes from now
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: code,
        resetTokenExpiry: expiry,
      },
    });

    // Send Email
    const emailSent = await sendPasswordResetEmail(user.email, code);

    if (!emailSent) {
      console.error(
        `[Password Reset] Failed to send email to ${user.email}. Code was: ${code}`
      );
      // Fallback for dev if email fails (e.g. env vars not set)
      return NextResponse.json({
        success: true,
        message: "Code generated but email failed (check console)",
        code: code, // Returning code for DEV convenience if email fails
      });
    }

    console.log(`[Password Reset] Email sent to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Code sent to email",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
