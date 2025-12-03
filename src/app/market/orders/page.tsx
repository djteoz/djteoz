import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?redirect=/market/orders");
  }

  let userId: string;
  try {
    const payload = verifyAccessToken(token) as { userId: string };
    userId = payload.userId;
  } catch (err) {
    redirect("/login?redirect=/market/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
          shop: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "COMPLETED": return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
      case "CANCELLED": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock size={16} />;
      case "COMPLETED": return <CheckCircle size={16} />;
      case "CANCELLED": return <XCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "В обработке";
      case "COMPLETED": return "Завершен";
      case "CANCELLED": return "Отменен";
      default: return status;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/market" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Мои заказы</h1>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-sm text-gray-500 mb-1">Заказ от {new Date(order.createdAt).toLocaleDateString()}</div>
                <div className="font-mono text-xs text-gray-400">#{order.id}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {order.totalAmount} ₽
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shrink-0">
                    {item.product.images[0] && (
                      <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">{item.shop.name}</div>
                        <Link href={`/market/product/${item.product.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1">
                          {item.product.title}
                        </Link>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">{item.price} ₽</div>
                        <div className="text-xs text-gray-500">{item.quantity} шт.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {order.address && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500">
                <span className="font-medium text-gray-700 dark:text-gray-300">Доставка:</span> {order.address}
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold mb-2">У вас пока нет заказов</h2>
            <p className="text-gray-500 mb-6">Самое время что-нибудь купить!</p>
            <Link
              href="/market"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
