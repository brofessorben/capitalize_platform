"use client";

import clsx from "clsx";

export default function ChatBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div
      className={clsx(
        "p-3 rounded-lg max-w-[80%] whitespace-pre-wrap",
        isUser ? "bg-green-600 text-white ml-auto" : "",
        isAssistant ? "bg-gray-700 text-gray-100 mr-auto" : "bg-gray-600 text-gray-100"
      )}
    >
      {content}
    </div>
  );
}
