"use client";
import { useTokenRefresh } from "../lib/useTokenRefresh";

export function TokenRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useTokenRefresh();
  return <>{children}</>;
}
