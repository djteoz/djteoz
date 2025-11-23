"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCommunityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Interest",
    type: "public",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      router.push(`/communities/${data.communityId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          Создание сообщества
        </h1>
        <p className="text-gray-600 mt-1">Объединяйте людей по интересам</p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input w-full"
              placeholder="Например: Любители котиков"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="input w-full"
            >
              <option value="Interest">Интересы</option>
              <option value="Music">Музыка</option>
              <option value="Games">Игры</option>
              <option value="IT">IT и Технологии</option>
              <option value="Science">Наука</option>
              <option value="Business">Бизнес</option>
              <option value="Humor">Юмор</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип сообщества
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "public", label: "Публичная страница", icon: "📢" },
                { id: "group", label: "Группа", icon: "👥" },
                { id: "event", label: "Мероприятие", icon: "📅" },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.type === type.id
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium text-sm text-gray-900">
                    {type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input w-full min-h-[100px]"
              placeholder="О чем ваше сообщество?"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary px-8"
            >
              {isLoading ? "Создание..." : "Создать сообщество"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
