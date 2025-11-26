import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "../../../lib/jwt";
import { prisma } from "../../../lib/db";
import SettingsForm from "./settings-form";

export default async function GeneralSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let user;
  try {
    const payload = verifyAccessToken(token) as { username: string };
    user = await prisma.user.findUnique({
      where: { username: payload.username },
      select: {
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        city: true,
        country: true,
        website: true,
        phone: true,
        gender: true,
        birthday: true,
        language: true,
        privacySettings: true,
        notificationSettings: true,
        themeSettings: true,
        blockedUsers: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  } catch (err) {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="card">
      <SettingsForm initialData={user} />
    </div>
  );
}
