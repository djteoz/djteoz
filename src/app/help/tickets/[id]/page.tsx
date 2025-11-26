import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/jwt";
import TicketChat from "./ticket-chat";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket || ticket.userId !== user.id) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/help/tickets"
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 mb-4"
        >
          ← Назад к списку
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {ticket.subject}
            </h1>
            <p className="text-gray-500">
              Тикет #{ticket.id.slice(-6).toUpperCase()} • {ticket.category}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold ${
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
      </div>

      <TicketChat
        ticketId={ticket.id}
        initialMessages={ticket.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
        status={ticket.status}
      />
    </div>
  );
}
