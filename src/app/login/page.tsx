"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check if already logged in
  useEffect(() => {
    let isMounted = true;
    fetch("/api/profile", { credentials: "include" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) return null;
        return res.json();
      })
      .then((profile) => {
        if (isMounted && profile && profile.username) {
          // Already logged in, go to home
          router.replace("/");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();
      console.log("Login response:", { status: res.status, ok: res.ok, data });

      if (res.ok && data.ok && data.accessToken) {
        console.log("Login successful, token:", data.accessToken);

        // Сохраняем токен в localStorage тоже
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.accessToken);
          console.log("Token saved to localStorage");
        }

        // Явно установим куку в браузер
        document.cookie = `token=${data.accessToken}; path=/; max-age=900`;
        console.log("Cookie set:", document.cookie);

        // Ждем немного
        await new Promise((r) => setTimeout(r, 500));

        // Перезагружаем страницу полностью
        console.log("Redirecting to /");
        window.location.href = "/";
      } else {
        const errorMsg = data.error || "Неверный логин или пароль";
        setError(errorMsg);
        console.error("Login failed:", errorMsg);
      }
    } catch (err) {
      setError("Ошибка при входе");
      console.error("Login error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md card p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white font-bold text-3xl mx-auto mb-4">
            L
          </div>
          <h2 className="text-3xl font-bold text-gray-900">С возвращением!</h2>
          <p className="text-gray-500 mt-2">Войдите в свой аккаунт Lumina</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Логин
            </label>
            <input
              type="text"
              placeholder="Введите ваш логин"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-200 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              placeholder="Введите ваш пароль"
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

          <button
            type="submit"
            className={`w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ${
              submitting ? "opacity-70 cursor-wait" : ""
            }`}
            disabled={submitting}
          >
            {submitting ? "Входим..." : "Войти"}
          </button>

          <div className="text-center mt-4">
            <span className="text-gray-500 text-sm">Нет аккаунта? </span>
            <Link
              href="/register"
              className="text-indigo-600 font-semibold hover:underline text-sm"
            >
              Зарегистрируйтесь
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
