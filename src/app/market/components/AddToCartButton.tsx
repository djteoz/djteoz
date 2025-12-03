"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  stock: number;
}

export default function AddToCartButton({
  productId,
  stock,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    if (stock <= 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/market/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        setIsAdded(true);
        router.refresh();
        setTimeout(() => setIsAdded(false), 2000);
      } else {
        if (res.status === 401) {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("Failed to add to cart", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (stock <= 0) {
    return (
      <button
        disabled
        className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-xl font-bold cursor-not-allowed"
      >
        Нет в наличии
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading || isAdded}
      className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
        isAdded
          ? "bg-green-500 text-white"
          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
      }`}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : isAdded ? (
        <>
          <Check size={20} />
          Добавлено
        </>
      ) : (
        <>
          <ShoppingCart size={20} />В корзину
        </>
      )}
    </button>
  );
}
