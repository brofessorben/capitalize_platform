"use client";

import React from "react";

type Props = {
  role: "assistant" | "referrer" | "vendor" | "host";
  content: string;
};

function normalize(text: string) {
  // kill markdown ** and turn -/* bullets into real bullets
  return text
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "• ");
}

export default function ChatBubble({ role, content }: Props) {
  const you = role !== "assistant";

  const bubble =
    (you
      ? "bg-[#0f1a14] border border-[#1f3b2d] text-[#c9fdd7]"
      : "bg-[#121212] border border-[#2a2a2a] text-[#eaeaea]") +
    " rounded-2xl px-4 py-3 w-full";

  const chip =
    (you
      ? "bg-[#133021] text-[#b7f7cc] border-[#1f3b2d]"
      : "bg-[#1c1c1c] text-[#d8d8d8] border-[#2a2a2a]") +
    " inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border";

  return (
    <div className="w-full">
      <div className={chip}>{role}</div>
      <div className={bubble} style={{ fontFamily: "system-ui, ui-rounded, Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
        <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
          {normalize(content)}
        </div>
      </div>
    </div>
  );
}
