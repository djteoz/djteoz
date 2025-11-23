import { prisma } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const targetUsername = "Alexander";
  let message = "";
  let userDetails = null;

  try {
    // 1. Try to find the user
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: targetUsername,
          mode: "insensitive", // Case insensitive search
        },
      },
    });

    if (!user) {
      message = `❌ Пользователь "${targetUsername}" не найден в базе данных. Пожалуйста, убедитесь, что вы зарегистрированы именно с этим логином.`;
    } else {
      // 2. Update the user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });

      userDetails = updatedUser;
      message = `✅ УСПЕХ! Пользователю "${updatedUser.username}" выданы права администратора (ADMIN).`;
    }
  } catch (error: any) {
    message = `❌ ОШИБКА БАЗЫ ДАННЫХ: ${error.message}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="card max-w-lg w-full p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4 border-b pb-2">
          Настройка Администратора
        </h1>

        <div
          className={`p-4 rounded-lg mb-4 ${
            message.startsWith("✅")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>

        {userDetails && (
          <div className="bg-gray-50 p-4 rounded text-sm font-mono">
            <p>ID: {userDetails.id}</p>
            <p>Username: {userDetails.username}</p>
            <p>
              Role: <strong>{userDetails.role}</strong>
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/"
            className="btn btn-primary px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Вернуться на главную
          </a>
        </div>
      </div>
    </div>
  );
}
