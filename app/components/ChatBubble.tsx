// app/components/ChatBubble.tsx
"use client";
import React from "react";

type Props = {
  role: "referrer" | "vendor" | "host" | "assistant" | string;
  content: string;
};

const palette: Record<string, { chip: string; bubble: string }> = {
  referrer:  { chip: "bg-emerald-700", bubble: "bg-[#0f201a]" },
  vendor:    { chip: "bg-sky-700",     bubble: "bg-[#0f1a20]" },
  host:      { chip: "bg-amber-700",   bubble: "bg-[#1a170f]" },
  assistant: { chip: "bg-purple-700",  bubble: "bg-[#160f20]" },
};

export default function ChatBubble({ role, content }: Props) {
  const theme = palette[role] || palette.assistant;

  return (
    <div className={`rounded-xl p-3 border border-[#223] ${theme.bubble}`}>
      <div className="mb-1 inline-flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${theme.chip}`}>
          {role === "assistant" ? "CAPITALIZE" : role}
        </span>
      </div>
      <div className="whitespace-pre-wrap leading-relaxed text-[#e7f7ef]">
        {content}
      </div>
    </div>
  );
}
