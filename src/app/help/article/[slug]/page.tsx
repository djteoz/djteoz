import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/db";
import ArticleFeedback from "./article-feedback";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await prisma.helpArticle.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/help" className="hover:text-indigo-600">
          Поддержка
        </Link>
        <span>/</span>
        <Link
          href={`/help/${article.category.slug}`}
          className="hover:text-indigo-600"
        >
          {article.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate">{article.title}</span>
      </div>

      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {article.title}
        </h1>

        <div
          className="prose prose-indigo max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      <ArticleFeedback articleId={article.id} />
    </div>
  );
}
