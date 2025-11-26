"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });
      if (res.ok) {
        setSuccess(true);
        // После регистрации уже залогинены, редиректим на главную
        setTimeout(() => {
          router.push("/");
          window.location.href = "/";
        }, 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка регистрации. Попробуйте другой логин.");
      }
    } catch (err) {
      setError("Ошибка при регистрации");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md card p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white font-bold text-3xl mx-auto mb-4">
            L
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Создать аккаунт</h2>
          <p className="text-gray-500 mt-2">Присоединяйтесь к Lumina Social</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Логин
            </label>
            <input
              type="text"
              placeholder="Придумайте логин"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-200 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Ваш email"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-200 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              placeholder="Придумайте пароль"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-200 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm text-center border border-green-100">
              Аккаунт успешно создан! Перенаправление...
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ${
              submitting ? "opacity-70 cursor-wait" : ""
            }`}
            disabled={submitting}
          >
            {submitting ? "Регистрация..." : "Зарегистрироваться"}
          </button>

          <p className="text-xs text-center text-gray-500 px-4">
            Нажимая кнопку «Зарегистрироваться», вы принимаете условия{" "}
            <Link
              href="/legal/terms"
              className="text-indigo-600 hover:underline"
            >
              Пользовательского соглашения
            </Link>{" "}
            и{" "}
            <Link
              href="/legal/privacy"
              className="text-indigo-600 hover:underline"
            >
              Политики конфиденциальности
            </Link>
          </p>

          <div className="text-center mt-2">
            <span className="text-gray-500 text-sm">Уже есть аккаунт? </span>
            <Link
              href="/login"
              className="text-indigo-600 font-semibold hover:underline text-sm"
            >
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
