"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2 } from "lucide-react";

export default function RegisterShopPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/market/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const shop = await res.json();
        router.push(`/market/shop/${shop.slug}`); // Redirect to shop page (to be created)
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create shop");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
          <Store size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Открыть магазин
        </h1>
        <p className="text-gray-500">Начните продавать свои товары сегодня</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm"
      >
        {error && (
          <div className="p-3 bg-red-100 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Название магазина
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
            placeholder="Мой Магазин"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL адрес (slug)
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
              market/shop/
            </span>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-r-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="my-shop"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
            placeholder="Расскажите о вашем магазине..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Создать магазин"}
        </button>
      </form>
    </div>
  );
}
