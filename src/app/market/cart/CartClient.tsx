"use client";

import { useState } from "react";
import { Trash2, Plus, Minus, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    discountPrice: number | null;
    images: string[];
    shop: {
      name: string;
      slug: string;
    };
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

export default function CartClient({
  initialCart,
}: {
  initialCart: Cart | null;
}) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Optimistic update
    setCart((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ),
      };
    });

    try {
      await fetch(`/api/market/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm("Удалить товар из корзины?")) return;

    // Optimistic update
    setCart((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });

    try {
      await fetch(`/api/market/cart/${itemId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to remove item");
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold mb-2">Корзина пуста</h2>
        <p className="text-gray-500 mb-6">Посмотрите предложения в маркете</p>
        <Link
          href="/market"
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Перейти к покупкам
        </Link>
      </div>
    );
  }

  const totalAmount = cart.items.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const totalDiscount = cart.items.reduce((sum, item) => {
    if (item.product.discountPrice) {
      return (
        sum + (item.product.price - item.product.discountPrice) * item.quantity
      );
    }
    return sum;
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex gap-4 shadow-sm"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0">
              {item.product.images[0] && (
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Store size={12} />
                      {item.product.shop.name}
                    </div>
                    <Link
                      href={`/market/product/${item.product.id}`}
                      className="font-medium text-gray-900 dark:text-white line-clamp-2 hover:text-indigo-600 transition-colors"
                    >
                      {item.product.title}
                    </Link>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mt-4">
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md disabled:opacity-50 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-medium w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {(item.product.discountPrice || item.product.price) *
                      item.quantity}{" "}
                    ₽
                  </div>
                  {item.product.discountPrice && (
                    <div className="text-xs text-gray-400 line-through">
                      {item.product.price * item.quantity} ₽
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm sticky top-24">
          <h3 className="text-xl font-bold mb-6">Итого</h3>

          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Товары ({cart.items.length})</span>
              <span>{totalAmount + totalDiscount} ₽</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Скидка</span>
                <span>-{totalDiscount} ₽</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-gray-700">
              <span>К оплате</span>
              <span>{totalAmount} ₽</span>
            </div>
          </div>

          <button
            onClick={() => alert("Checkout functionality coming soon!")}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            Перейти к оформлению
          </button>

          <div className="mt-4 text-xs text-gray-400 text-center">
            Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
          </div>
        </div>
      </div>
    </div>
  );
}
