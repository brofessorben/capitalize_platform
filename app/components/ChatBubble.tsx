
"use client";
import React from "react";

// --- super-light Markdown → HTML (links, bold, headings, bullets, code) ---
function mdToHtml(md = "") {
  let html = String(md);

  // Escape HTML
  html = html.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  // Headings ###, ##, #
  html = html
    .replace(/^######\s?(.*)$/gm, '<h6 class="font-semibold text-sm mt-2 mb-1">$1</h6>')
    .replace(/^#####\s?(.*)$/gm, '<h5 class="font-semibold text-sm mt-2 mb-1">$1</h5>')
    .replace(/^####\s?(.*)$/gm, '<h4 class="font-semibold text-base mt-2 mb-1">$1</h4>')
    .replace(/^###\s?(.*)$/gm, '<h3 class="font-semibold text-lg mt-2 mb-1">$1</h3>')
    .replace(/^##\s?(.*)$/gm,  '<h2 class="font-semibold text-xl mt-2 mb-2">$1</h2>')
    .replace(/^#\s?(.*)$/gm,   '<h1 class="font-semibold text-2xl mt-2 mb-2">$1</h1>');

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Inline code `code`
  html = html.replace(/`([^`]+?)`/g, '<code class="px-1 py-0.5 rounded bg-neutral-800/70 border border-neutral-700 text-[0.9em]">$1</code>');

  // Lists: lines starting with - or *
  // Convert blocks of list items into <ul>
  html = html.replace(
    /(^|\n)([-*]\s.+(?:\n[-*]\s.+)*)/g,
    (_, pfx, block) => {
      const items = block
        .split(/\n/)
        .map((line) => line.replace(/^[-*]\s+/, ""))
        .map((li) => `<li class="leading-relaxed">${li}</li>`)
        .join("");
      return `${pfx}<ul class="list-disc pl-5 my-2 space-y-1">${items}</ul>`;
    }
  );

  // Numbered list like "1. text"
  html = html.replace(
    /(^|\n)((?:\d+\.\s.+\n?)+)/g,
    (_, pfx, block) => {
      const items = block
        .trim()
        .split(/\n/)
        .map((line) => line.replace(/^\d+\.\s+/, ""))
        .map((li) => `<li class="leading-relaxed">${li}</li>`)
        .join("");
      return `${pfx}<ol class="list-decimal pl-5 my-2 space-y-1">${items}</ol>`;
    }
  );

  // Links [text](url) → clean anchor (no raw brackets)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 decoration-emerald-400 hover:text-emerald-300">$1</a>'
  );

  // Newlines → paragraphs (but keep lists/heads intact)
  html = html
    .split(/\n{2,}/)
    .map((chunk) => {
      if (/^\s*<(h\d|ul|ol)/.test(chunk)) return chunk; // already block-level
      return `<p class="leading-relaxed">${chunk.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

export default function ChatBubble({ role = "ai", content = "" }) {
  const isUser = role === "user";
  const html = mdToHtml(content);

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[92%] md:max-w-[80%] rounded-2xl px-4 py-3 shadow",
          // colors: cool + readable
          isUser
            ? "bg-emerald-600 text-white"
            : "bg-neutral-900/70 text-neutral-100 border border-neutral-800"
        ].join(" ")}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
