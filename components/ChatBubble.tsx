"use client";
import MarkdownMessage from "./MarkdownMessage";

export default function ChatBubble({
  role,
  content,
}: { role: "ai" | "user"; content: string }) {
  const base = "rounded-2xl px-4 py-3 shadow-sm border max-w-[720px]";
  const ai = "bg-white border-gray-200";
  const user = "bg-gray-900 text-white border-gray-800";
  return (
    <div className={`w-full my-2 flex ${role === "ai" ? "justify-start" : "justify-end"}`}>
      <div className={`${base} ${role === "ai" ? ai : user}`}>
        <MarkdownMessage text={content} />
      </div>
    </div>
  );
}