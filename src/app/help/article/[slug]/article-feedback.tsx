"use client";

import { useState } from "react";
import Link from "next/link";

export default function ArticleFeedback({ articleId }: { articleId: string }) {
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(
    null
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Была ли эта статья полезной?
      </h3>

      {!feedback ? (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setFeedback("helpful")}
            className="px-6 py-2 rounded-full border border-gray-200 hover:border-green-500 hover:text-green-600 transition-colors"
          >
            👍 Да, спасибо
          </button>
          <button
            onClick={() => setFeedback("not-helpful")}
            className="px-6 py-2 rounded-full border border-gray-200 hover:border-red-500 hover:text-red-600 transition-colors"
          >
            👎 Нет, не помогло
          </button>
        </div>
      ) : feedback === "helpful" ? (
        <div className="text-green-600 font-medium">
          Спасибо за отзыв! Мы рады, что смогли помочь.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-gray-600">
            Жаль, что статья не помогла. Попробуйте поискать другое решение или
            свяжитесь с нами.
          </div>
          <Link
            href="/help/tickets/new"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
          >
            Написать в поддержку
          </Link>
        </div>
      )}
    </div>
  );
}
