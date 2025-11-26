"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/setup/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Успешно! Вы теперь OWNER. Перенаправление...");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      } else {
        setStatus("❌ Ошибка: " + data.error);
      }
    } catch (err) {
      setStatus("❌ Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Назначение OWNER</h1>
        <p className="text-gray-600 mb-6 text-sm text-center">
          Введите секретный ключ для получения прав владельца.
        </p>
        
        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Секретный ключ
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Введите ключ..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Обработка..." : "Получить права"}
          </button>
        </form>

        {status && (
          <div className={`mt-4 p-3 rounded-lg text-sm text-center ${status.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
