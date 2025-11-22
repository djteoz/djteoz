import { useEffect } from "react";

/**
 * Хук для автоматического обновления access token перед его истечением
 * Использует refresh token для получения нового access token
 */
export function useTokenRefresh() {
  useEffect(() => {
    // Проверяем токен каждые 5 минут (access token истекает через 15 минут)
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          // Если refresh не сработал, редиректим на логин
          if (res.status === 401) {
            window.location.href = "/login";
          }
        }
      } catch (err) {
        console.error("Token refresh error:", err);
      }
    }, 5 * 60 * 1000); // каждые 5 минут

    return () => clearInterval(interval);
  }, []);
}

/**
 * Обёртка для fetch запросов с автоматическим обновлением токена
 */
export async function fetchWithTokenRefresh(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // Если получили 401, попробуем обновить токен и повторить запрос
  if (response.status === 401) {
    const refreshRes = await fetch("/api/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Повторяем оригинальный запрос с новым токеном
      response = await fetch(url, {
        ...options,
        credentials: "include",
      });
    } else {
      // Refresh не сработал — редиректим на логин
      window.location.href = "/login";
    }
  }

  return response;
}
