// app/components/ChatBubble.jsx
"use client";
import React from "react";

// Tiny Markdown-to-HTML (bold, italics, headings, bullets, paragraphs)
function mdToHtml(input) {
  if (!input) return "";
  let t = input;

  // Escape basic HTML
  t = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Headings (#, ##)
  t = t.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
  t = t.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
  t = t.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

  // Bold **text** and italics *text*
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Bullets: lines starting with -, *, or •
  const lines = t.split(/\r?\n/);
  const out = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*(?:[-*•])\s+(.*)$/);
    if (bulletMatch) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${bulletMatch[1]}</li>`);
    } else if (line.trim() === "") {
      flushList();
      out.push("<br/>");
    } else {
      flushList();
      out.push(`<p>${line}</p>`);
    }
  }
  flushList();

  return out.join("\n");
}

export default function ChatBubble({ role, text }) {
  const isMe = role === "user";
  const html = mdToHtml(text);

  return (
    <div className={`w-full flex ${isMe ? "justify-end" : "justify-start"} my-2`}>
      <div
        className={`max-w-[720px] rounded-2xl px-4 py-3 leading-relaxed
          ${isMe ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-100 border border-neutral-700"}`}
        style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
