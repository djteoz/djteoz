"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/help/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create ticket");

      const { ticketId } = await res.json();
      router.push(`/help/tickets/${ticketId}`);
    } catch (err) {
      setError("Произошла ошибка при создании заявки. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Создание обращения
      </h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="font-semibold text-gray-700">
              Тема обращения
            </label>
            <input
              type="text"
              name="subject"
              required
              className="input"
              placeholder="Кратко опишите проблему"
            />
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-gray-700">Категория</label>
            <select name="category" className="input" required>
              <option value="">Выберите категорию...</option>
              <option value="account">Проблемы с аккаунтом</option>
              <option value="billing">Платежи и подписки</option>
              <option value="technical">Техническая ошибка</option>
              <option value="safety">Безопасность и нарушения</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-gray-700">
              Подробное описание
            </label>
            <textarea
              name="message"
              required
              className="input min-h-[150px]"
              placeholder="Опишите детали вашей проблемы, шаги для воспроизведения и т.д."
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Отправка..." : "Отправить обращение"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
