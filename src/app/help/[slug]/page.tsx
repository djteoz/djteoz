import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/db";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.helpCategory.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { isPublished: true },
        orderBy: { helpful: "desc" },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link
          href="/help"
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 mb-4"
        >
          ← Назад в центр поддержки
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{category.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {category.name}
            </h1>
            <p className="text-gray-500 mt-1">{category.description}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {category.articles.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {category.articles.map((article) => (
              <Link
                key={article.id}
                href={`/help/article/${article.slug}`}
                className="block p-6 hover:bg-gray-50 transition-colors group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 mb-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-gray-500 text-sm">{article.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            В этой категории пока нет статей.
          </div>
        )}
      </div>
    </div>
  );
}
