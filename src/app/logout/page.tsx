"use client";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    fetch("/api/logout", { method: "POST", credentials: "include" }).then(
      () => (window.location.href = "/login")
    );
  }, []);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Выход...</div>
    </div>
  );
}
