// app/components/ChatBubble.tsx
"use client";
import React from "react";

/** super-tiny class joiner so we don't need the `clsx` package */
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type BubbleProps = {
  role: "user" | "ai";
  content?: string;
};

/** very small + safe markdown-ish to HTML */
function renderMarkdown(input?: string) {
  let html = String(input ?? "");

  // Escape HTML
  html = html.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

  // Headings ###, ##, #
  html = html
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // Bold **text** and italics _text_
  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

  // Bullets (- or •) → list items
  const lines = html.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    const m = line.match(/^\s*(?:-|\u2022)\s+(.*)$/);
    if (m) {
      if (!inList) {
        inList = true;
        out.push("<ul>");
      }
      out.push(`<li>${m[1]}</li>`);
    } else {
      if (inList) {
        inList = false;
        out.push("</ul>");
      }
      out.push(line);
    }
  }
  if (inList) out.push("</ul>");
  html = out.join("\n");

  // basic links: [title](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`
  );

  // Line breaks → paragraphs
  html = html
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return { __html: html };
}

export default function ChatBubble({ role, content }: BubbleProps) {
  const isUser = role === "user";
  return (
    <div
      className={cx(
        "w-full",
        isUser ? "flex justify-end" : "flex justify-start"
      )}
    >
      <div
        className={cx(
          "max-w-[800px] w-full rounded-2xl px-4 py-3 shadow-sm leading-relaxed",
          // theme: dark, modern, readable
          isUser
            ? "bg-emerald-600 text-white"
            : "bg-neutral-800 text-neutral-100 border border-neutral-700"
        )}
      >
        <div className="prose prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-1">
          <div dangerouslySetInnerHTML={renderMarkdown(content)} />
        </div>
      </div>
    </div>
  );
}
