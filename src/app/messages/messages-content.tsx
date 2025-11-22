"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Conversation {
  id: string;
  otherUser: string;
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUser = searchParams.get("user");

  const [conversations, setConversations] = useState<Conversation[]>([]);
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
          fetchConversations();
        } else {
          router.push("/login");
        }
      });
  }, [router]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages", { credentials: "include" });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return;

      const data = await res.json();
      setConversations(data.conversations || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setLoading(false);
    }
  };

  // Полинг для автоматического обновления диалогов каждые 5 секунд
  useEffect(() => {
    if (!currentUser) return;

    // Первоначальная загрузка
    fetchConversations();

    // Установка интервала для полинга
    const interval = setInterval(() => {
      fetchConversations();
    }, 5000); // Обновляем каждые 5 секунд

    return () => clearInterval(interval);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-80px)]">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500 mb-6">
        Мессенджер
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100%-60px)]">
        {/* Список диалогов */}
        <div className="md:col-span-1 card p-0 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-white/20 bg-white/40 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-gray-800">Диалоги</h2>
          </div>

          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-4">
              <div>
                <div className="text-4xl mb-2">💬</div>
                <p className="text-gray-600">Нет активных диалогов</p>
                <Link
                  href="/search"
                  className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                >
                  Найти пользователя
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/messages?user=${conv.otherUser}`}
                  className={`block p-4 border-b border-white/10 hover:bg-white/30 transition ${
                    selectedUser === conv.otherUser
                      ? "bg-indigo-50/50 border-l-4 border-l-indigo-500"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {conv.otherUser}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage || "Нет сообщений"}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Диалог */}
        {selectedUser ? (
          <ChatWindow user={selectedUser} currentUser={currentUser} />
        ) : (
          <div className="hidden md:flex md:col-span-2 items-center justify-center card h-full">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-50">💬</div>
              <p className="text-gray-600 text-lg">
                Выберите диалог для начала общения
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatWindow({
  user,
  currentUser,
}: {
  user: string;
  currentUser: string | null;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUserData, setOtherUserData] = useState<any>(null);

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(user)}`, {
        credentials: "include",
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return;

      const data = await res.json();
      setMessages(data.messages || []);
      setOtherUserData(data.otherUser);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setLoading(false);
    }
  };

  // Полинг для автоматического обновления сообщений каждые 5 секунд
  useEffect(() => {
    // Первоначальная загрузка
    fetchMessages();

    // Установка интервала для полинга
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000); // Обновляем каждые 5 секунд

    return () => clearInterval(interval);
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipient: user, text: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="md:col-span-2 card flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const fullName = otherUserData
    ? `${otherUserData.firstName} ${otherUserData.lastName}`.trim() ||
      otherUserData.username
    : user;

  return (
    <div className="md:col-span-2 card p-0 flex flex-col overflow-hidden h-full">
      {/* Заголовок */}
      <div className="p-4 border-b border-white/20 bg-white/40 backdrop-blur-md flex items-center gap-3 z-10">
        {otherUserData?.avatar ? (
          <img
            src={`/uploads/${otherUserData.avatar}`}
            alt={fullName}
            className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center text-white font-bold">
            {fullName[0].toUpperCase()}
          </div>
        )}
        <div>
          <Link
            href={`/profile/${user}`}
            className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors"
          >
            {fullName}
          </Link>
          <p className="text-xs text-indigo-500 font-medium">@{user}</p>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/20 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-2">👋</div>
              <p className="text-gray-600">Начните разговор!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === currentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${
                  msg.sender === currentUser
                    ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none border border-white/50"
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 text-right ${
                    msg.sender === currentUser
                      ? "text-white/70"
                      : "text-gray-400"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Форма отправки */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-white/20 bg-white/40 backdrop-blur-md flex gap-2"
      >
        <input
          type="text"
          className="input flex-1"
          placeholder="Напишите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          maxLength={5000}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            "➤"
          )}
        </button>
      </form>
    </div>
  );
}
