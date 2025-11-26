import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "../../lib/jwt";
import { prisma } from "../../lib/db";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  let user;
  try {
    const payload = verifyAccessToken(token) as { username: string };
    user = await prisma.user.findUnique({
      where: { username: payload.username },
    });
  } catch (e) {
    redirect("/login");
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
    redirect("/");
  }

  const [usersCount, postsCount, reportsCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.report.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Обзор</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium uppercase">
            Пользователи
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {usersCount}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium uppercase">
            Публикации
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {postsCount}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium uppercase">
            Активные жалобы
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {reportsCount}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Последние действия
        </h2>
        <div className="text-gray-500 text-sm text-center py-8">
          Журнал действий пока пуст
        </div>
      </div>
    </div>
  );
}
