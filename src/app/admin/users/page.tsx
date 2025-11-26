"use client";

import { useState, useEffect } from "react";
import { UserAvatar } from "../../../components/UserAvatar";

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  isBanned: boolean;
  avatar: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    // Fetch current user role to know permissions
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => setCurrentUserRole(data.role));

    fetchUsers();
  }, []);

  const fetchUsers = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${query}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Вы уверены, что хотите назначить роль ${newRole}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchUsers(search);
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка при смене роли");
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  const handleBan = async (userId: string, isBanned: boolean) => {
    if (
      !confirm(
        isBanned
          ? "Заблокировать пользователя?"
          : "Разблокировать пользователя?"
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned }),
      });

      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, isBanned } : u)));
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка");
      }
    } catch (err) {
      alert("Ошибка сети");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Поиск..."
            className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Найти
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500">
                  Пользователь
                </th>
                <th className="px-6 py-4 font-medium text-gray-500">Email</th>
                <th className="px-6 py-4 font-medium text-gray-500">Роль</th>
                <th className="px-6 py-4 font-medium text-gray-500">Статус</th>
                <th className="px-6 py-4 font-medium text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Загрузка...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatar={user.avatar}
                          name={user.username}
                          size={32}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "OWNER"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : user.role === "MODERATOR"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBanned ? (
                        <span className="text-red-600 font-medium">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {currentUserRole === "OWNER" &&
                          user.role !== "OWNER" && (
                            <select
                              className="text-xs border border-gray-200 rounded px-2 py-1"
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value)
                              }
                            >
                              <option value="USER">User</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="ADMIN">Admin</option>
                              <option value="OWNER">Owner (Transfer)</option>
                            </select>
                          )}

                        {user.role !== "OWNER" &&
                          (currentUserRole === "OWNER" ||
                            (currentUserRole === "ADMIN" &&
                              user.role !== "ADMIN")) && (
                            <button
                              onClick={() => handleBan(user.id, !user.isBanned)}
                              className={`text-xs px-3 py-1 rounded border ${
                                user.isBanned
                                  ? "border-green-200 text-green-700 hover:bg-green-50"
                                  : "border-red-200 text-red-700 hover:bg-red-50"
                              }`}
                            >
                              {user.isBanned ? "Разблок." : "Блок."}
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
