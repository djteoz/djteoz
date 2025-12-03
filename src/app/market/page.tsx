import { prisma } from "@/lib/db";
import Link from "next/link";
import { ShoppingCart, Search, Package, Store } from "lucide-react";

export default async function MarketPage() {
  const categories = await prisma.productCategory.findMany({
    where: { parentId: null },
    include: { children: true },
  });

  const featuredProducts = await prisma.product.findMany({
    take: 10,
    orderBy: { soldCount: "desc" },
    include: { shop: true },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header / Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Store size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Маркет
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Тысячи товаров рядом с вами
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl w-full mx-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Искать товары..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/market/orders"
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
            title="Мои заказы"
          >
            <Package size={24} />
          </Link>
          <Link
            href="/market/cart"
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-colors relative"
            title="Корзина"
          >
            <ShoppingCart size={24} />
            {/* <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/market/category/${category.slug}`}
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all group"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              {/* Placeholder for category image/icon */}
              📦
            </div>
            <span className="text-center font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {category.name}
            </span>
          </Link>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            Категории пока не созданы
          </div>
        )}
      </div>

      {/* Featured Products */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Популярное
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
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
                      ((product.price - product.discountPrice) /
                        product.price) *
                        100
                    )}
                    %
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 mb-1">
                  {product.shop.name}
                </div>
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
        {featuredProducts.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
            <p className="text-gray-500">
              Товаров пока нет. Станьте первым продавцом!
            </p>
            <Link
              href="/market/seller/register"
              className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Открыть магазин
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
