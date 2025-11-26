"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Friend {
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  useEffect(() => {
    Promise.all([fetchFriends(), fetchRequests()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends", {
        credentials: "include",
      });

      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("application/json")) {
        if (!res.ok) {
          router.push("/login");
        }
        return;
      }

      const data = await res.json();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
      setError("Ошибка загрузки друзей");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends/requests", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    if (!confirm("Удалить из друзей?")) return;
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "remove", username: friendUsername }),
      });

      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.username !== friendUsername));
      }
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  const handleAcceptRequest = async (username: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "accept", username }),
      });

      if (res.ok) {
        // Move from requests to friends
        const request = requests.find((r) => r.username === username);
        if (request) {
          setRequests((prev) => prev.filter((r) => r.username !== username));
          setFriends((prev) => [
            {
              username: request.username,
              firstName: request.firstName,
              lastName: request.lastName,
              avatar: request.avatar,
              bio: request.bio,
            },
            ...prev,
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleRejectRequest = async (username: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject", username }),
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.username !== username));
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500 mb-2">
          Друзья
        </h1>
        <div className="flex gap-4 mt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("friends")}
            className={`pb-2 px-4 font-medium transition-colors relative ${
              activeTab === "friends"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Мои друзья
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {friends.length}
            </span>
            {activeTab === "friends" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-2 px-4 font-medium transition-colors relative ${
              activeTab === "requests"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Заявки
            {requests.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                {requests.length}
              </span>
            )}
            {activeTab === "requests" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {activeTab === "friends" ? (
        friends.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 text-lg mb-6">У вас пока нет друзей</p>
            <Link href="/search" className="btn btn-primary inline-block">
              Найти людей
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => {
              const fullName =
                [friend.firstName, friend.lastName].filter(Boolean).join(" ") ||
                friend.username;

              return (
                <div
                  key={friend.username}
                  className="card p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border-0"
                >
                  <div className="relative h-32 bg-gradient-to-r from-indigo-400 to-pink-400">
                    {/* Banner placeholder */}
                  </div>
                  <div className="px-6 pb-6 relative">
                    <div className="absolute -top-12 left-6 w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white">
                      <img
                        src={
                          friend.avatar
                            ? `/uploads/${friend.avatar}`
                            : "/default-avatar.png"
                        }
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-14">
                      <Link
                        href={`/profile/${friend.username}`}
                        className="block group-hover:text-indigo-600 transition-colors"
                      >
                        <h3 className="text-xl font-bold text-gray-800">
                          {fullName}
                        </h3>
                      </Link>
                      <p className="text-indigo-500 font-medium text-sm">
                        @{friend.username}
                      </p>

                      {friend.bio && (
                        <p className="text-gray-600 text-sm mt-3 line-clamp-2 h-10">
                          {friend.bio}
                        </p>
                      )}

                      <div className="mt-6 flex gap-3">
                        <Link
                          href={`/profile/${friend.username}`}
                          className="flex-1 btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-center py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Профиль
                        </Link>
                        <button
                          onClick={() => handleRemoveFriend(friend.username)}
                          className="flex-1 btn bg-pink-50 text-pink-600 hover:bg-pink-100 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Requests Tab
        requests.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">Нет новых заявок в друзья</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => {
              const fullName =
                [request.firstName, request.lastName].filter(Boolean).join(" ") ||
                request.username;

              return (
                <div
                  key={request.id}
                  className="card p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border-0"
                >
                  <div className="relative h-32 bg-gradient-to-r from-purple-400 to-indigo-400"></div>
                  <div className="px-6 pb-6 relative">
                    <div className="absolute -top-12 left-6 w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white">
                      <img
                        src={
                          request.avatar
                            ? `/uploads/${request.avatar}`
                            : "/default-avatar.png"
                        }
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-14">
                      <Link
                        href={`/profile/${request.username}`}
                        className="block group-hover:text-indigo-600 transition-colors"
                      >
                        <h3 className="text-xl font-bold text-gray-800">
                          {fullName}
                        </h3>
                      </Link>
                      <p className="text-indigo-500 font-medium text-sm">
                        @{request.username}
                      </p>

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => handleAcceptRequest(request.username)}
                          className="flex-1 btn bg-indigo-600 text-white hover:bg-indigo-700 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Принять
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.username)}
                          className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
