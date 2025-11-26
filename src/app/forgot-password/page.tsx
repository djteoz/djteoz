"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(
          "Код восстановления отправлен на вашу почту. Проверьте папку 'Входящие' или 'Спам'."
        );
        // In a real app, we wouldn't show the code, but for dev:
        if (data.code) {
          console.log("Recovery Code:", data.code);
          setMessage(
            `Код восстановления (DEV): ${data.code}. Перейдите на страницу сброса.`
          );
        }
      } else {
        setError(data.error || "Ошибка отправки");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Восстановление пароля
        </h1>

        {message ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg">
              {message}
            </div>
            <Link
              href="/reset-password"
              className="btn btn-primary w-full block text-center"
            >
              Ввести код
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email или телефон
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="Введите email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Отправка..." : "Отправить код"}
            </button>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:underline"
              >
                Вернуться ко входу
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
