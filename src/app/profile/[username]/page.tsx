"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "../../../components/UserAvatar";

interface UserProfile {
  username: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  city?: string;
  country?: string;
  birthday?: string;
  website?: string;
  interests?: string;
  phone?: string;
  createdAt?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loadingFriend, setLoadingFriend] = useState(false);

  useEffect(() => {
    // Получить текущего пользователя и его друзей
    fetch("/api/profile", { credentials: "include" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.username) setCurrentUser(data.username);
      });

    // Получить список друзей
    fetch("/api/friends", { credentials: "include" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.friends) {
          const friendUsernames = data.friends.map((f: any) => f.username);
          if (friendUsernames.includes(username)) {
            setIsFriend(true);
          }
        }
      });

    // Получить профиль пользователя
    if (!username) {
      setError("Username не найден");
      setLoading(false);
      return;
    }

    fetch(`/api/user?username=${encodeURIComponent(username)}`, {
      credentials: "include",
    })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!res.ok || !ct.includes("application/json")) {
          throw new Error("User not found");
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Пользователь не найден");
        setLoading(false);
      });
  }, [username]);

  const handleToggleFriend = async () => {
    setLoadingFriend(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: isFriend ? "remove" : "add",
          username: username,
        }),
      });

      if (res.ok) {
        setIsFriend(!isFriend);
      }
    } catch (err) {
      console.error("Failed to toggle friend:", err);
    } finally {
      setLoadingFriend(false);
    }
  };

  const handleSendMessage = () => {
    router.push(`/messages?user=${encodeURIComponent(username)}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <div className="text-lg text-red-600">{error}</div>
        <Link href="/" className="text-blue-600 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser === username;
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Заголовок профиля */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex gap-8">
          {/* Аватар */}
          <div className="flex-shrink-0">
            <UserAvatar
              avatar={profile.avatar}
              name={fullName}
              size={128}
              className="border-4 border-blue-500 shadow-lg"
            />
          </div>

          {/* Основная информация */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{fullName}</h1>
            <p className="text-gray-600 text-lg">@{profile.username}</p>

            {profile.bio && (
              <p className="text-gray-700 mt-3 text-base">{profile.bio}</p>
            )}

            {/* Дополнительная информация */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
              {profile.city && (
                <div>
                  <span className="font-semibold text-gray-700">Город:</span>{" "}
                  {profile.city}
                </div>
              )}
              {profile.country && (
                <div>
                  <span className="font-semibold text-gray-700">Страна:</span>{" "}
                  {profile.country}
                </div>
              )}
              {profile.birthday && (
                <div>
                  <span className="font-semibold text-gray-700">
                    День рождения:
                  </span>{" "}
                  {new Date(profile.birthday).toLocaleDateString("ru-RU")}
                </div>
              )}
              {profile.website && (
                <div>
                  <span className="font-semibold text-gray-700">Сайт:</span>{" "}
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.interests && (
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700">Интересы:</span>{" "}
                  {profile.interests}
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="mt-6 flex gap-4">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Редактировать профиль
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleToggleFriend}
                    disabled={loadingFriend}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                      isFriend
                        ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    } ${loadingFriend ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {loadingFriend
                      ? "Обработка..."
                      : isFriend
                      ? "✓ В друзьях"
                      : "Добавить в друзья"}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    💬 Сообщение
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Заглушка для дальнейшего контента */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Фото</h2>
        <div className="text-center text-gray-500 py-8">
          Галерея фото (скоро будет)
        </div>
      </div>
    </div>
  );
}
