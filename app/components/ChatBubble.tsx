"use client";

interface ChatBubbleProps {
  role: "user" | "system" | "assistant";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  let bubbleColor = "bg-gray-200 text-black";
  if (isUser) bubbleColor = "bg-blue-500 text-white";
  if (isSystem) bubbleColor = "bg-green-500 text-white";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow ${bubbleColor}`}
      >
        {content}
      </div>
    </div>
  );
}
