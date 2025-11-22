"use client";

import { useEffect } from "react";

/**
 * Компонент для перехвата всех fetch запросов
 * и автоматического добавления Authorization header из localStorage
 */
export function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = function (
      this: typeof window,
      input: RequestInfo | URL,
      init?: RequestInit
    ) {
      const token = localStorage.getItem("token");

      if (token) {
        const headers = new Headers(init?.headers || {});
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        init = {
          ...init,
          headers,
        };
      }

      return originalFetch.call(this, input, init);
    } as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
