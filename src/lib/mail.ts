import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, code: string) {
  const mailOptions = {
    from: `"Lumina Security" <${process.env.SMTP_EMAIL}>`,
    to: to,
    subject: "Сброс пароля - Lumina",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5; margin: 0;">Lumina</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Запрос на сброс пароля</h2>
          <p style="color: #4b5563;">Мы получили запрос на сброс пароля для вашего аккаунта.</p>
          <p style="color: #4b5563;">Ваш код подтверждения:</p>
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4f46e5;">${code}</span>
          </div>
          <p style="color: #4b5563; font-size: 14px;">Код действителен в течение 15 минут.</p>
          <p style="color: #4b5563; font-size: 14px;">Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Lumina Social Network. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
