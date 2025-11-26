"use client";

import { useState } from "react";
import Link from "next/link";

export default function ArticleFeedback({ articleId }: { articleId: string }) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (value: "yes" | "no") => {
    setFeedback(value);
    setSubmitted(true);

    // Here you would typically send this to the API
    // await fetch(`/api/help/article/${articleId}/feedback`, { method: 'POST', body: JSON.stringify({ helpful: value === 'yes' }) });
  };

  if (submitted && feedback === "yes") {
    return (
      <div className="bg-green-50 text-green-800 p-6 rounded-xl text-center">
        <p className="font-medium">
          Спасибо за отзыв! Мы рады, что смогли помочь.
        </p>
      </div>
    );
  }

  if (submitted && feedback === "no") {
    return (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <p className="text-gray-900 font-medium mb-4 text-center">
          Нам жаль, что статья не помогла решить вашу проблему.
        </p>
        <div className="flex justify-center">
          <Link href="/help/tickets/new" className="btn btn-primary">
            Связаться с поддержкой
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Была ли эта статья полезной?
      </h3>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleFeedback("yes")}
          className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:border-green-500 hover:text-green-600 transition-colors font-medium"
        >
          👍 Да, спасибо
        </button>
        <button
          onClick={() => handleFeedback("no")}
          className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-600 transition-colors font-medium"
        >
          👎 Нет, не помогло
        </button>
      </div>
    </div>
  );
}
