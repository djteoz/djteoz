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

      // Determine URL string
      let urlString = "";
      if (typeof input === "string") {
        urlString = input;
      } else if (input instanceof URL) {
        urlString = input.toString();
      } else if (input instanceof Request) {
        urlString = input.url;
      }

      // Only add token for internal requests (relative or same origin)
      const isInternal =
        urlString.startsWith("/") ||
        urlString.startsWith(window.location.origin);

      if (token && isInternal) {
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
