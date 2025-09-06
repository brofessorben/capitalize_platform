"use client";

import React from "react";

/**
 * Tiny, dependency-free markdown renderer:
 * - headings, bold, italics, inline code, links, lists, paragraphs
 * - escapes HTML first (safe)
 */
function renderMarkdown(md: string): string {
  let html = String(md ?? "");

  // Escape HTML (keeps us safe)
  html = html.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

  // Headings
  html = html
    .replace(/^### (.*$)/gim, "<h3 class='font-semibold text-base mb-1'>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2 class='font-semibold text-lg mb-1'>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1 class='font-semibold text-xl mb-1'>$1</h1>");

  // Bold / Italic / Code
  html = html
    .replace(/\*\*(.+?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+?)`/gim, "<code class='px-1 py-0.5 rounded bg-neutral-800/70 border border-neutral-700'>$1</code>");

  // Links [text](url)
  html = html.replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/gim, `<a href="$2" target="_blank" rel="noopener" class="underline decoration-dotted">$1</a>`);

  // Bulleted lists
  html = html.replace(/(^|\n)\s*-\s+(.+)(?=\n|$)/gim, "$1<li>$2</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, "<ul class='list-disc pl-5 space-y-1'>$1</ul>");

  // Paragraphs (don’t wrap block elements)
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^\s*<(h\d|ul|li|pre|code)/i.test(block)) return block;
      return `<p class="leading-relaxed">${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

export default function ChatBubble({
  role,
  content,
}: {
  role: "user" | "ai" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div
      className={`rounded-2xl px-4 py-3 border ${
        isUser
          ? "self-end bg-emerald-600/20 border-emerald-600/40 text-emerald-100"
          : "self-start bg-neutral-800/60 border-neutral-700 text-neutral-100"
      }`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "") }}
    />
  );
}
