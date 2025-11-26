"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../../components/UserAvatar";

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
    phone?: string | null;
    gender?: string | null;
    birthday?: Date | string | null;
    language?: string | null;
    privacySettings?: any;
    notificationSettings?: any;
    themeSettings?: any;
    blockedUsers?: Array<{
      id: string;
      username: string;
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
    }>;
  };
}

type Tab =
  | "account"
  | "security"
  | "privacy"
  | "notifications"
  | "media"
  | "apps"
  | "payments"
  | "blacklist";

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Local state for JSON fields to handle nested updates
  const [privacySettings, setPrivacySettings] = useState(
    initialData.privacySettings || {
      profileVisibility: "public",
      messagePermission: "everyone",
      showOnlineStatus: true,
    }
  );

  const [notificationSettings, setNotificationSettings] = useState(
    initialData.notificationSettings || {
      emailNotifications: true,
      pushNotifications: true,
      newFollower: true,
      newComment: true,
      newLike: true,
    }
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Merge JSON fields
    const payload = {
      ...data,
      privacySettings,
      notificationSettings,
    };

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

  const handleUnblock = async (userId: string) => {
    if (!confirm("Разблокировать пользователя?")) return;

    try {
      const res = await fetch("/api/user/block", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        router.refresh();
        setMessage({ type: "success", text: "Пользователь разблокирован" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: "account", label: "Аккаунт", icon: "👤" },
    { id: "security", label: "Безопасность", icon: "🔒" },
    { id: "privacy", label: "Приватность", icon: "👁️" },
    { id: "notifications", label: "Уведомления", icon: "🔔" },
    { id: "media", label: "Медиа", icon: "📷" },
    { id: "apps", label: "Приложения", icon: "📱" },
    { id: "payments", label: "Платежи", icon: "💳" },
    { id: "blacklist", label: "Черный список", icon: "🚫" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-50 text-indigo-600 font-medium border-l-4 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Основная информация
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Имя пользователя
                  </label>
                  <input
                    className="input bg-gray-100 cursor-not-allowed opacity-70"
                    type="text"
                    name="username"
                    defaultValue={initialData.username}
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Email
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
                  <label className="text-sm font-semibold text-gray-700">
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
                  <label className="text-sm font-semibold text-gray-700">
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
                  <label className="text-sm font-semibold text-gray-700">
                    Телефон
                  </label>
                  <input
                    className="input"
                    type="tel"
                    name="phone"
                    defaultValue={initialData.phone || ""}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Дата рождения
                  </label>
                  <input
                    className="input"
                    type="date"
                    name="birthday"
                    defaultValue={
                      initialData.birthday
                        ? new Date(initialData.birthday)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
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
                  <label className="text-sm font-semibold text-gray-700">
                    Страна
                  </label>
                  <input
                    className="input"
                    type="text"
                    name="country"
                    defaultValue={initialData.country || ""}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Язык
                  </label>
                  <select
                    className="input"
                    name="language"
                    defaultValue={initialData.language || "ru"}
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Веб-сайт
                </label>
                <input
                  className="input"
                  type="url"
                  name="website"
                  defaultValue={initialData.website || ""}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  О себе
                </label>
                <textarea
                  className="input min-h-[100px]"
                  name="bio"
                  defaultValue={initialData.bio || ""}
                />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Безопасность
              </h2>
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                Функции смены пароля и 2FA находятся в разработке.
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Приватность
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Видимость профиля
                    </h3>
                    <p className="text-sm text-gray-500">
                      Кто может видеть вашу страницу
                    </p>
                  </div>
                  <select
                    className="input w-auto"
                    value={privacySettings.profileVisibility}
                    onChange={(e) =>
                      setPrivacySettings({
                        ...privacySettings,
                        profileVisibility: e.target.value,
                      })
                    }
                  >
                    <option value="public">Все</option>
                    <option value="friends">Только друзья</option>
                    <option value="private">Только я</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Кто может писать сообщения
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ограничение входящих сообщений
                    </p>
                  </div>
                  <select
                    className="input w-auto"
                    value={privacySettings.messagePermission}
                    onChange={(e) =>
                      setPrivacySettings({
                        ...privacySettings,
                        messagePermission: e.target.value,
                      })
                    }
                  >
                    <option value="everyone">Все</option>
                    <option value="friends">Только друзья</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Показывать статус "Онлайн"
                    </h3>
                    <p className="text-sm text-gray-500">
                      Другие пользователи будут видеть, когда вы в сети
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={privacySettings.showOnlineStatus}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          showOnlineStatus: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Уведомления
              </h2>

              <div className="space-y-4">
                {[
                  {
                    key: "emailNotifications",
                    label: "Email уведомления",
                    desc: "Получать важные новости на почту",
                  },
                  {
                    key: "newFollower",
                    label: "Новые подписчики",
                    desc: "Уведомлять, когда кто-то подписывается",
                  },
                  {
                    key: "newComment",
                    label: "Комментарии",
                    desc: "Уведомлять о новых комментариях",
                  },
                  {
                    key: "newLike",
                    label: "Лайки",
                    desc: "Уведомлять о лайках ваших постов",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.label}
                      </h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notificationSettings[item.key]}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            [item.key]: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Медиа</h2>
              <div className="p-4 bg-gray-50 text-gray-600 rounded-xl border border-gray-200">
                Настройки качества фото и видео, автовоспроизведение и другие
                параметры медиа.
              </div>
            </div>
          )}

          {activeTab === "apps" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Приложения
              </h2>
              <div className="p-4 bg-gray-50 text-gray-600 rounded-xl border border-gray-200">
                Управление подключенными приложениями и сессиями.
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Платежи</h2>
              <div className="p-4 bg-gray-50 text-gray-600 rounded-xl border border-gray-200">
                История платежей и привязанные карты.
              </div>
            </div>
          )}

          {activeTab === "blacklist" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Черный список
              </h2>

              {initialData.blockedUsers &&
              initialData.blockedUsers.length > 0 ? (
                <div className="space-y-4">
                  {initialData.blockedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={user.avatar}
                          alt={user.username}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnblock(user.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Разблокировать
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  В черном списке пока никого нет
                </div>
              )}
            </div>
          )}

          {activeTab !== "blacklist" && (
            <div className="pt-6 mt-6 border-t border-gray-100">
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
          )}
        </form>
      </div>
    </div>
  );
}
