"use client";

/**
 * Tiny Markdown -> HTML (no libs):
 * - ###, ##, # headings
 * - Bulleted lists (- item)
 * - **bold**, *italic*
 * - Blank lines = new paragraphs
 */
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mdInline(html) {
  // bold then italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return html;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  let out = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (let raw of lines) {
    const line = raw.trimRight();

    // Headings
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

    // List items (- item)
    if (/^-\s+/.test(line)) {
      if (!inList) {
        out.push("<ul class=\"list-disc pl-5 space-y-1\">");
        inList = true;
      }
      out.push(`<li>${mdInline(escapeHtml(line.replace(/^-\s+/, "")))}</li>`);
      continue;
    }

    // Blank line => paragraph break
    if (line.trim() === "") {
      flushList();
      out.push("<p></p>");
      continue;
    }

    // Regular paragraph line
    flushList();
    out.push(`<p>${mdInline(escapeHtml(line))}</p>`);
  }
  flushList();

  // Collapse consecutive empty <p> tags
  const html = out.join("\n").replace(/(<p><\/p>\s*)+/g, "<p></p>");
  return html;
}

export default function ChatBubble({ role, content }) {
  const isUser = role === "user";
  const html = mdToHtml(content || "");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "rounded-2xl px-4 py-3 max-w-[680px] w-fit",
          isUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900",
        ].join(" ")}
        style={{ wordBreak: "break-word" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
