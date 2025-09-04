"use client";
import React from "react";

type Role = "user" | "ai" | "assistant" | "system";

interface ChatBubbleProps {
  role: Role;
  text?: string;      // for AIChatPage.jsx which passes `text`
  content?: string;   // backward compat if something else passes `content`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function mdInline(s: string): string {
  let html = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return html;
}
function mdToHtml(md: string): string {
  const lines = (md || "").replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];   // ← key fix: explicitly string[]
  let inList = false;

  const flushList = (): void => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/,"");

    if (/^###\s+/.test(line)) {
      flushList();
      out.push(`<h3>${mdInline(escapeHtml(line.replace(/^###\s+/, "")))}</h3>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushList();
      out.push(`<h2>${mdInline(escapeHtml(line.replace(/^##\s+/, "")))}</h2>`);
      continue;
    }
    if (/^#\s+/.test(line)) {
      flushList();
      out.push(`<h1>${mdInline(escapeHtml(line.replace(/^#\s+/, "")))}</h1>`);
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      if (!inList) {
        out.push('<ul class="list-disc pl-5 space-y-1">');
        inList = true;
      }
      out.push(`<li>${mdInline(escapeHtml(line.replace(/^\s*[-*•]\s+/, "")))}</li>`);
      continue;
    }

    if (line.trim() === "") {
      flushList();
      out.push("<p></p>");
      continue;
    }

    flushList();
    out.push(`<p>${mdInline(escapeHtml(line))}</p>`);
  }

  flushList();
  return out.join("\n").replace(/(<p><\/p>\s*)+/g, "<p></p>");
}

export default function ChatBubble({ role, text, content }: ChatBubbleProps) {
  const isUser = role === "user";
  const html = mdToHtml(text ?? content ?? "");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}>
      <div
        className={[
          "rounded-2xl px-4 py-3 max-w-[680px] w-fit leading-relaxed",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-neutral-800 text-neutral-100 border border-neutral-700",
        ].join(" ")}
        style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
