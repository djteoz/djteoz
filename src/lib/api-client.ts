// Утилита для выполнения fetch-запросов с автоматическим добавлением Authorization header

export async function apiRequest(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options?.headers || {});

  // Добавляем Authorization header если есть токен
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

// Также экспортируем функцию для удаления токена при logout
export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
  }
}

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}
