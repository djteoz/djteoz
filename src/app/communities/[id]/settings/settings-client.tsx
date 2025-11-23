"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../../../../components/UserAvatar";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  joinedAt: string;
}

interface SettingsClientProps {
  community: {
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    cover: string | null;
    category: string | null;
    website: string | null;
    type: string;
  };
  currentUserRole: string;
}

export default function SettingsClient({
  community,
  currentUserRole,
}: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "members">("general");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description || "",
    category: community.category || "Interest",
    website: community.website || "",
    avatar: community.avatar,
    cover: community.cover,
  });

  // Members State
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (activeTab === "members") {
      fetchMembers();
    }
  }, [activeTab]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/communities/${community.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "avatar" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      setIsLoading(true);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setFormData((prev) => ({ ...prev, [field]: data.url }));
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка загрузки файла" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update");

      setMessage({ type: "success", text: "Настройки сохранены" });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка сохранения" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/communities/${community.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.user.id === userId ? { ...m, role: newRole } : m))
        );
      }
    } catch (error) {
      console.error("Failed to update role", error);
    }
  };

  const handleKick = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите исключить этого участника?")) return;

    try {
      const res = await fetch(`/api/communities/${community.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.user.id !== userId));
      }
    } catch (error) {
      console.error("Failed to kick member", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === "general"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Основное
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Участники
        </button>
      </div>

      <div className="p-6">
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {activeTab === "general" ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Images */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Обложка
                </label>
                <div className="relative h-40 rounded-xl bg-gray-100 overflow-hidden group">
                  {formData.cover ? (
                    <img
                      src={formData.cover}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Нет обложки
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer btn bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-none">
                      Загрузить
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "cover")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Аватар
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-xl bg-gray-100 overflow-hidden group shrink-0">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">
                        👥
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                        📷
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "avatar")}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Рекомендуемый размер 200x200px. <br />
                    Поддерживаются JPG, PNG.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input w-full"
                  required
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Веб-сайт
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="input w-full"
                placeholder="https://"
              />
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
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary px-8"
              >
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {loadingMembers ? (
              <div className="text-center py-8 text-gray-500">
                Загрузка участников...
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatar={member.user.avatar}
                        name={
                          member.user.firstName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.username
                        }
                        size={40}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.user.firstName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.role} • Вступил{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentUserRole === "OWNER" &&
                        member.role !== "OWNER" && (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.user.id, e.target.value)
                            }
                            className="text-xs border-gray-200 rounded-lg"
                          >
                            <option value="ADMIN">Админ</option>
                            <option value="MODERATOR">Модератор</option>
                            <option value="MEMBER">Участник</option>
                          </select>
                        )}

                      {(currentUserRole === "OWNER" ||
                        (currentUserRole === "ADMIN" &&
                          member.role !== "ADMIN" &&
                          member.role !== "OWNER")) &&
                        member.role !== "OWNER" && (
                          <button
                            onClick={() => handleKick(member.user.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-sm"
                          >
                            Исключить
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
