import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { verifyAccessToken } from "../../../lib/jwt";

export default async function MyTicketsPage() {
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

  if (!user) redirect("/login");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Мои обращения</h1>
        <Link href="/help/tickets/new" className="btn btn-primary">
          + Новое обращение
        </Link>
      </div>

      {tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/help/tickets/${ticket.id}`}
              className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {ticket.subject}
                  </h3>
                  <span className="text-sm text-gray-500">
                    #{ticket.id.slice(-6).toUpperCase()} • {ticket.category}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.status === "OPEN"
                      ? "bg-green-100 text-green-700"
                      : ticket.status === "CLOSED"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {ticket.status === "OPEN"
                    ? "Открыто"
                    : ticket.status === "CLOSED"
                    ? "Закрыто"
                    : "В работе"}
                </span>
              </div>
              <p className="text-gray-600 line-clamp-1">
                {ticket.messages[0]?.content || "Нет сообщений"}
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Обновлено: {new Date(ticket.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            У вас пока нет обращений
          </h3>
          <p className="text-gray-500 mb-6">
            Если у вас возникли проблемы, создайте новый тикет
          </p>
          <Link href="/help/tickets/new" className="btn btn-primary">
            Создать обращение
          </Link>
        </div>
      )}
    </div>
  );
}
