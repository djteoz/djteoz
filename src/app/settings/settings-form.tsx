"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  initialData: {
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    city?: string | null;
    country?: string | null;
    website?: string | null;
  };
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to update settings");
      }

      setMessage({ type: "success", text: "Настройки успешно сохранены!" });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: "Ошибка при сохранении настроек" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Имя пользователя
          </label>
          <input
            className="input bg-gray-100 cursor-not-allowed opacity-70"
            type="text"
            name="username"
            defaultValue={initialData.username}
            readOnly
            title="Имя пользователя нельзя изменить"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Email адрес
          </label>
          <input
            className="input"
            type="email"
            name="email"
            defaultValue={initialData.email}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Имя
          </label>
          <input
            className="input"
            type="text"
            name="firstName"
            defaultValue={initialData.firstName || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Фамилия
          </label>
          <input
            className="input"
            type="text"
            name="lastName"
            defaultValue={initialData.lastName || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Город
          </label>
          <input
            className="input"
            type="text"
            name="city"
            defaultValue={initialData.city || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            Страна
          </label>
          <input
            className="input"
            type="text"
            name="country"
            defaultValue={initialData.country || ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          Веб-сайт
        </label>
        <input
          className="input"
          type="url"
          name="website"
          placeholder="https://example.com"
          defaultValue={initialData.website || ""}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          О себе
        </label>
        <textarea
          className="input min-h-[100px] resize-y"
          name="bio"
          defaultValue={initialData.bio || ""}
          placeholder="Расскажите немного о себе..."
        />
      </div>

      <div className="pt-4">
        <button
          className="btn btn-primary w-full sm:w-auto px-8"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Сохранение...
            </div>
          ) : (
            "Сохранить изменения"
          )}
        </button>
      </div>
    </form>
  );
}
