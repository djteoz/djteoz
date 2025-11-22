"use client";
import { Suspense } from "react";
import MessagesContent from "./messages-content";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Загрузка...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
