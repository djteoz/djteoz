import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "../../lib/jwt";
import { prisma } from "../../lib/db";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
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
      },
    });
  } catch (err) {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          Настройки
        </h1>
        <p className="text-gray-600 mt-1">Управление вашим профилем</p>
      </div>

      <div className="card">
        <SettingsForm initialData={user} />
      </div>
    </main>
  );
}
