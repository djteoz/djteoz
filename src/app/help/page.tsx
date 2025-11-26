import Link from "next/link";
import { prisma } from "../../lib/db";

export default async function HelpPage() {
  const categories = await prisma.helpCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl text-white mb-12 relative overflow-hidden">
        <div className="relative z-10 px-4">
          <h1 className="text-4xl font-bold mb-4">Как мы можем помочь?</h1>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Найдите ответы в нашей базе знаний или свяжитесь с командой
            поддержки
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <form action="/help/search" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Поиск по статьям (например, 'как сменить пароль')"
                className="w-full px-6 py-4 rounded-full text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-400/50 text-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
      </div>

      {/* Categories Grid */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Категории помощи
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/help/${category.slug}`}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {category.icon || "📄"}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
              {category.name}
            </h3>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {category.description}
            </p>
            <div className="text-sm font-medium text-indigo-600">
              {category._count.articles} статей →
            </div>
          </Link>
        ))}
      </div>

      {/* Community & Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100">
          <h3 className="text-xl font-bold text-indigo-900 mb-2">
            Сообщество поддержки
          </h3>
          <p className="text-indigo-700 mb-6">
            Общайтесь с другими пользователями, делитесь опытом и находите
            решения вместе.
          </p>
          <Link
            href="/communities/lumina-support"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Перейти в сообщество
          </Link>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Мои обращения
          </h3>
          <p className="text-gray-500 mb-6">
            Отслеживайте статус ваших тикетов и общайтесь с агентами поддержки.
          </p>
          <Link
            href="/help/tickets"
            className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-colors"
          >
            Проверить статус
          </Link>
        </div>
      </div>
    </div>
  );
}
