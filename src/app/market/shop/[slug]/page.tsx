import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, Star } from "lucide-react";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
      },
      owner: true,
    },
  });

  if (!shop) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link
        href="/market"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Назад в маркет
      </Link>

      {/* Shop Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
          {shop.logo ? (
            <img
              src={shop.logo}
              alt={shop.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <Store size={40} />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {shop.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mb-4">
            {shop.description || "Нет описания"}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 justify-center md:justify-start">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star fill="currentColor" size={16} />
              <span className="font-medium text-gray-900 dark:text-white">
                {shop.rating.toFixed(1)}
              </span>
            </div>
            <span>•</span>
            <span>{shop.products.length} товаров</span>
            <span>•</span>
            <span>Владелец: {shop.owner.firstName || shop.owner.username}</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Товары магазина
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {shop.products.map((product) => (
          <Link
            key={product.id}
            href={`/market/product/${product.id}`}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
          >
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              {product.discountPrice && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  -
                  {Math.round(
                    ((product.price - product.discountPrice) / product.price) *
                      100
                  )}
                  %
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 h-10">
                {product.title}
              </h3>
              <div className="flex items-end gap-2">
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {product.discountPrice || product.price} ₽
                </span>
                {product.discountPrice && (
                  <span className="text-sm text-gray-400 line-through mb-1">
                    {product.price} ₽
                  </span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  ⭐ {product.rating.toFixed(1)}
                </span>
                <span>{product.soldCount} купили</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {shop.products.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
          <p className="text-gray-500">В этом магазине пока нет товаров.</p>
        </div>
      )}
    </div>
  );
}
