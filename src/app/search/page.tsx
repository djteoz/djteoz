"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface SearchResult {
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          credentials: "include",
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          setResults([]);
          return;
        }

        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Дебаунс 300ms

    return () => clearTimeout(timer);
  }, [query]);

  const fullName = (result: SearchResult) =>
    [result.firstName, result.lastName].filter(Boolean).join(" ") ||
    result.username;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500 mb-2">
          Поиск пользователей
        </h1>
        <p className="text-gray-600">
          Найдите новых друзей или интересующих вас людей
        </p>
      </div>

      {/* Поисковая строка */}
      <div className="mb-12 max-w-2xl mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-400 text-xl">🔍</span>
        </div>
        <input
          type="text"
          className="input pl-12 py-4 text-lg rounded-2xl shadow-lg border-transparent focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          placeholder="Введите имя, фамилию или логин..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Результаты поиска */}
      {loading && query.length >= 2 && (
        <div className="text-center text-gray-600 py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-lg">Ищем...</div>
        </div>
      )}

      {searched && !loading && results.length === 0 && query.length >= 2 && (
        <div className="text-center text-gray-600 py-8">
          <div className="text-6xl mb-4">😔</div>
          <div className="text-xl font-medium">Ничего не найдено</div>
          <p className="text-sm mt-2 text-gray-500">
            Попробуйте изменить запрос
          </p>
        </div>
      )}

      {query.length < 2 && !searched && (
        <div className="text-center text-gray-400 py-12 opacity-60">
          <div className="text-6xl mb-4">⌨️</div>
          <div className="text-lg">Введите минимум 2 символа для поиска</div>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((result) => (
            <div
              key={result.username}
              className="card p-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 border-0"
            >
              <div className="relative h-32 bg-gradient-to-r from-indigo-400 to-pink-400" />
              <div className="relative px-6 pb-8">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <img
                    src={
                      result.avatar
                        ? `/uploads/${result.avatar}`
                        : "/default-avatar.png"
                    }
                    alt={fullName(result)}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                </div>

                <div className="text-center mt-14">
                  <Link href={`/profile/${result.username}`}>
                    <h3 className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors">
                      {fullName(result)}
                    </h3>
                  </Link>
                  <p className="text-indigo-500 font-medium text-sm">
                    @{result.username}
                  </p>

                  {result.bio && (
                    <p className="text-gray-600 text-sm mt-4 line-clamp-2 h-10 px-4">
                      {result.bio}
                    </p>
                  )}

                  <Link
                    href={`/profile/${result.username}`}
                    className="mt-6 inline-block w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all duration-300"
                  >
                    Просмотреть профиль
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
