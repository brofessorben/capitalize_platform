"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatBubbleProps = {
  role: "assistant" | "user" | "system";
  text: string;
};

export default function ChatBubble({ role, text }: ChatBubbleProps) {
  const isUser = role === "user";
  return (
    <div
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[800px] w-full rounded-2xl px-4 py-3 leading-6
          ${isUser ? "bg-[#2563eb] text-white" : "bg-[#2a2a2a] text-[#e5e7eb]"}
        `}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-3">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-6 mb-3">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-3">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
            a: ({ href, children }) => (
              <a className="underline" href={href ?? "#"} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="px-1 py-0.5 rounded bg-black/30">{children}</code>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
