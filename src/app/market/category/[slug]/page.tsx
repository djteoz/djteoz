import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let category = null;
  let products: any[] = [];

  try {
    category = await prisma.productCategory.findUnique({
      where: { slug },
      include: {
        children: true,
      },
    });

    if (category) {
      // Find products in this category OR its subcategories
      const categoryIds = [category.id, ...category.children.map((c) => c.id)];

      products = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          isArchived: false,
        },
        include: {
          shop: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (error) {
    console.error("Failed to fetch category data:", error);
  }

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/market"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {category.name}
          </h1>
          <p className="text-gray-500">{products.length} товаров</p>
        </div>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/market/category/${child.slug}`}
              className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors whitespace-nowrap"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
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

      {products.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
          <p className="text-gray-500">В этой категории пока нет товаров.</p>
        </div>
      )}
    </div>
  );
}
