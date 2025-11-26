"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PrivacyLevel = "EVERYONE" | "FRIENDS" | "FRIENDS_OF_FRIENDS" | "ONLY_ME";

interface PrivacySettings {
  profileVisibility: PrivacyLevel;
  basicInfoVisibility: PrivacyLevel;
  groupsVisibility: PrivacyLevel;
  giftsVisibility: PrivacyLevel;
  postsVisibility: PrivacyLevel;
  commentsVisibility: PrivacyLevel;
  wallPosting: PrivacyLevel;
  photosVisibility: PrivacyLevel;
  tagging: PrivacyLevel;
  messages: PrivacyLevel;
  calls: PrivacyLevel;
  invites: PrivacyLevel;
  appsInvites: PrivacyLevel;
}

const LABELS: Record<PrivacyLevel, string> = {
  EVERYONE: "Все пользователи",
  FRIENDS: "Только друзья",
  FRIENDS_OF_FRIENDS: "Друзья друзей",
  ONLY_ME: "Только я",
};

export default function PrivacySettingsForm() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/settings/privacy")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load privacy settings", err);
        setLoading(false);
      });
  }, []);

  const handleChange = async (key: keyof PrivacySettings, value: PrivacyLevel) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);

    try {
      await fetch("/api/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error("Failed to save setting", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePrivateProfile = async () => {
    if (!settings) return;
    const isPrivate = settings.profileVisibility === "FRIENDS";
    const newValue = isPrivate ? "EVERYONE" : "FRIENDS";
    
    // When enabling private profile, set everything to FRIENDS or ONLY_ME
    const newSettings = { ...settings };
    
    if (!isPrivate) {
      // Enabling private mode
      Object.keys(newSettings).forEach((key) => {
        // Don't change ONLY_ME settings
        if (newSettings[key as keyof PrivacySettings] !== "ONLY_ME") {
           newSettings[key as keyof PrivacySettings] = "FRIENDS";
        }
      });
    } else {
      // Disabling private mode - just open profile, keep others as is or reset?
      // Usually just opens the profile visibility
      newSettings.profileVisibility = "EVERYONE";
    }

    setSettings(newSettings);
    setSaving(true);

    try {
      await fetch("/api/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.error("Failed to save private mode", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Загрузка настроек...</div>;
  }

  if (!settings) {
    return <div className="p-8 text-center text-red-500">Ошибка загрузки настроек</div>;
  }

  const Select = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: PrivacyLevel;
    onChange: (val: PrivacyLevel) => void;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <span className="text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PrivacyLevel)}
        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
      >
        {Object.entries(LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Private Profile Toggle */}
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-indigo-900">Закрытый профиль</h3>
            <p className="text-sm text-indigo-700 mt-1">
              Ограничить доступ к вашей странице для всех, кроме друзей
            </p>
          </div>
          <button
            onClick={togglePrivateProfile}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              settings.profileVisibility === "FRIENDS" || settings.profileVisibility === "ONLY_ME" ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.profileVisibility === "FRIENDS" || settings.profileVisibility === "ONLY_ME" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-indigo-600/80">
          В закрытом профиле ваши записи и фото доступны только друзьям. Незнакомцы видят только имя и аватар.
        </p>
      </div>

      {/* My Page */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Моя страница</h3>
        <Select
          label="Кто видит основную информацию моей страницы"
          value={settings.basicInfoVisibility}
          onChange={(v) => handleChange("basicInfoVisibility", v)}
        />
        <Select
          label="Кто видит список моих групп"
          value={settings.groupsVisibility}
          onChange={(v) => handleChange("groupsVisibility", v)}
        />
        <Select
          label="Кто видит список моих подарков"
          value={settings.giftsVisibility}
          onChange={(v) => handleChange("giftsVisibility", v)}
        />
      </div>

      {/* Posts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Записи на странице</h3>
        <Select
          label="Кто видит чужие записи на моей странице"
          value={settings.postsVisibility}
          onChange={(v) => handleChange("postsVisibility", v)}
        />
        <Select
          label="Кто может оставлять записи на моей странице"
          value={settings.wallPosting}
          onChange={(v) => handleChange("wallPosting", v)}
        />
        <Select
          label="Кто может комментировать мои записи"
          value={settings.commentsVisibility}
          onChange={(v) => handleChange("commentsVisibility", v)}
        />
      </div>

      {/* Photos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Фотографии</h3>
        <Select
          label="Кто видит мои фотографии"
          value={settings.photosVisibility}
          onChange={(v) => handleChange("photosVisibility", v)}
        />
        <Select
          label="Кто может отмечать меня на фотографиях"
          value={settings.tagging}
          onChange={(v) => handleChange("tagging", v)}
        />
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Связь со мной</h3>
        <Select
          label="Кто может писать мне личные сообщения"
          value={settings.messages}
          onChange={(v) => handleChange("messages", v)}
        />
        <Select
          label="Кто может мне звонить"
          value={settings.calls}
          onChange={(v) => handleChange("calls", v)}
        />
        <Select
          label="Кто может приглашать меня в сообщества"
          value={settings.invites}
          onChange={(v) => handleChange("invites", v)}
        />
        <Select
          label="Кто может приглашать меня в приложения"
          value={settings.appsInvites}
          onChange={(v) => handleChange("appsInvites", v)}
        />
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Предварительный просмотр</span>
            <Link
              href="/profile?viewAs=public"
              target="_blank"
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline"
            >
              Посмотреть, как видят мою страницу другие
            </Link>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Юридическая информация</span>
            <Link
              href="/legal/privacy"
              target="_blank"
              className="text-gray-500 hover:text-gray-700 text-sm hover:underline"
            >
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          Сохранение настроек...
        </div>
      )}
    </div>
  );
}
