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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFriends();
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
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendUsername: string) => {
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
          Мои друзья
        </h1>
        <p className="text-gray-600">Всего друзей: {friends.length}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {friends.length === 0 ? (
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
      )}
    </div>
  );
}
