import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, ShoppingCart, Store } from "lucide-react";
import AddToCartButton from "../../components/AddToCartButton";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
        category: true,
        reviews: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);
  }

  if (!product) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <div
                key={idx}
                className="aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-500 transition-all"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {product.title}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star fill="currentColor" size={16} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                {product.reviews.length} отзывов
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{product.soldCount} купили</span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                {product.discountPrice || product.price} ₽
              </span>
              {product.discountPrice && (
                <span className="text-xl text-gray-400 line-through mb-1">
                  {product.price} ₽
                </span>
              )}
            </div>

            <AddToCartButton productId={product.id} stock={product.stock} />

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <Link
                href={`/market/shop/${product.shop.slug}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Store size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Продавец</div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {product.shop.name}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold mb-2">Описание</h3>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {product.specifications && (
            <div>
              <h3 className="text-lg font-bold mb-3">Характеристики</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                {Object.entries(
                  product.specifications as Record<string, string>
                ).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-gray-500">{key}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">
          Отзывы ({product.reviews.length})
        </h2>
        <div className="space-y-6">
          {product.reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                  {review.user.avatar ? (
                    <img
                      src={review.user.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                      {review.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {review.user.firstName || review.user.username}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < review.rating ? "currentColor" : "none"}
                        className={i < review.rating ? "" : "text-gray-300"}
                      />
                    ))}
                    <span className="text-gray-400 ml-2 text-xs">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{review.text}</p>
              {review.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {product.reviews.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              Отзывов пока нет. Будьте первым!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
