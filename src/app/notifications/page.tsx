"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  type: "friend_request" | "post_like" | "comment" | "message";
  fromUser: string;
  fromUserAvatar?: string;
  content: string;
  postId?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // Проверить авторизацию
    fetch("/api/profile", { credentials: "include" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.username) {
          setCurrentUser(data.username);
          loadNotifications();
        } else {
          router.push("/login");
        }
      });
  }, [router]);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const ct = res.headers.get("content-type") || "";

      if (!ct.includes("application/json")) {
        // Если API еще не готов, используем демо-данные
        const demoNotifications: Notification[] = [
          {
            id: "notif_1",
            type: "friend_request",
            fromUser: "ivan_petrov",
            fromUserAvatar: "avatar1.jpg",
            content: "добавил вас в друзья",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            id: "notif_2",
            type: "post_like",
            fromUser: "maria_sokolova",
            fromUserAvatar: "avatar2.jpg",
            content: "понравился ваш пост",
            postId: "post_123",
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
          {
            id: "notif_3",
            type: "comment",
            fromUser: "alex_popov",
            fromUserAvatar: "avatar3.jpg",
            content: "прокомментировал ваш пост",
            postId: "post_123",
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
        ];
        setNotifications(demoNotifications);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setNotifications(data.notifications || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setLoading(false);
    }
  };

  // Полинг для автоматического обновления уведомлений каждые 10 секунд
  useEffect(() => {
    if (!currentUser) return;

    // Первоначальная загрузка
    loadNotifications();

    // Установка интервала для полинга
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000); // Обновляем каждые 10 секунд

    return () => clearInterval(interval);
  }, [currentUser]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return "👥";
      case "post_like":
        return "❤️";
      case "comment":
        return "💬";
      case "message":
        return "✉️";
      default:
        return "📢";
    }
  };

  const getNotificationText = (notification: Notification) => {
    const text =
      {
        friend_request: `добавил вас в друзья`,
        post_like: `понравился ваш пост`,
        comment: `прокомментировал ваш пост`,
        message: `отправил вам сообщение`,
      }[notification.type] || notification.content;

    return (
      <>
        <Link
          href={`/profile/${notification.fromUser}`}
          className="font-semibold text-blue-600 hover:underline"
        >
          @{notification.fromUser}
        </Link>{" "}
        {text}
      </>
    );
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);

    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes}м назад`;
    if (hours < 24) return `${hours}ч назад`;
    if (days < 7) return `${days}д назад`;

    return new Date(date).toLocaleDateString("ru-RU");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          Уведомления
        </h1>
        <button
          className="btn bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 text-sm py-2 px-4"
          onClick={() => {
            setNotifications(notifications.map((n) => ({ ...n, read: true })));
          }}
        >
          Отметить все как прочитанные
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🔔</div>
          <p className="text-gray-600 text-lg">У вас нет новых уведомлений</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`card p-4 flex items-start gap-4 cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 ${
                !notif.read
                  ? "border-l-pink-500 bg-white/80"
                  : "border-l-transparent opacity-80 hover:opacity-100"
              }`}
              onClick={() => {
                if (notif.type === "friend_request") {
                  router.push(`/profile/${notif.fromUser}`);
                } else if (notif.postId) {
                  router.push(`/feed?postId=${notif.postId}`);
                } else if (notif.type === "message") {
                  router.push(`/messages?user=${notif.fromUser}`);
                }
              }}
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl text-white shadow-md ${
                    notif.type === "post_like"
                      ? "bg-gradient-to-br from-pink-400 to-red-500"
                      : notif.type === "friend_request"
                      ? "bg-gradient-to-br from-indigo-400 to-blue-500"
                      : notif.type === "comment"
                      ? "bg-gradient-to-br from-green-400 to-teal-500"
                      : "bg-gradient-to-br from-purple-400 to-violet-500"
                  }`}
                >
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <p className="text-gray-800 text-sm leading-relaxed">
                  {getNotificationText(notif)}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {formatTime(notif.createdAt)}
                </p>
              </div>

              {!notif.read && (
                <div className="flex-shrink-0 self-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full shadow-sm animate-pulse"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
