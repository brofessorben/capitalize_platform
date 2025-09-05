// app/components/ChatBubble.tsx
"use client";
import React from "react";
import clsx from "clsx";

type Role = "user" | "ai";

interface ChatBubbleProps {
  role: Role;
  content: string | undefined;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  // Always work with a string
  let html: string = String(content ?? "");

  // Escape HTML
  html = html.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

  // Headings ###, ##, #
  html = html
    .replace(/^###\s+(.*)$/gim, "<h3>$1</h3>")
    .replace(/^##\s+(.*)$/gim, "<h2>$1</h2>")
    .replace(/^#\s+(.*)$/gim, "<h1>$1</h1>");

  // Horizontal rule
  html = html.replace(/^\s*---\s*$/gim, "<hr/>");

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold **text** and Italic *text*
  // Do bold first to avoid interfering with italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>`
  );

  // Lists (support multi-line)
  html = transformLists(html);

  // Paragraphs: split on double newlines, wrap in <p> (skip if already block element)
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^\s*<(h1|h2|h3|ul|ol|li|hr|pre|code)/i.test(block.trim())) return block;
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  const isUser = role === "user";

  return (
    <div
      className={clsx(
        "flex",
        isUser ? "justify-end" : "justify-start",
        "w-full"
      )}
    >
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-emerald-600 text-white"
            : "bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm"
        )}
      >
        <div
          className="prose prose-invert prose-p:my-2 prose-h1:mt-0 prose-h2:mt-0 prose-h3:mt-0 prose-h1:mb-2 prose-h2:mb-2 prose-h3:mb-2 prose-hr:my-3 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-black/30"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

/** Turn lines starting with "- " into <ul><li>…</li></ul> blocks. */
function transformLists(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  let inList = false;

  const flush = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const m = line.match(/^\s*-\s+(.*)$/);
    if (m) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${m[1]}</li>`);
    } else {
      flush();
      out.push(line);
    }
  }
  flush();
  return out.join("\n");
}
