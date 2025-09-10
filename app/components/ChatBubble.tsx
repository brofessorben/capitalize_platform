"use client";

import clsx from "clsx";
import React from "react";

/** Light formatter:
 * - strips **bold** markers
 * - turns "- " and "* " into "• "
 * - converts H-like lines "Title:" to a styled heading with a fun emoji
 */
function formatPlain(text: string) {
  if (!text) return "";
  let t = text;

  // kill markdown bold/italics markers
  t = t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1");

  // bullet markers
  t = t.replace(/^\s*[-*]\s+/gm, "• ");

  // ### headings-ish: lines that end with ":" and not too long
  t = t.replace(
    /^(?!• )(?!\s*$)([^\n]{3,60}):\s*$/gm,
    (m, p1) => `\n§§§ ${p1}\n`
  );

  return t.trim();
}

function renderWithHeadings(text: string) {
  const parts = formatPlain(text).split("\n");
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const line = parts[i];

    if (line.startsWith("§§§ ")) {
      const title = line.replace("§§§ ", "");
      nodes.push(
        <div key={`h-${i}`} className="mt-3 mb-1 text-[15px] font-semibold tracking-wide">
          {/* emoji sprinkle */}
          <span className="mr-1">✨</span>{title}
        </div>
      );
    } else if (line.startsWith("• ")) {
      // collapse contiguous bullets into a <ul>
      const items: string[] = [line.slice(2)];
      let j = i + 1;
      while (j < parts.length && parts[j].startsWith("• ")) {
        items.push(parts[j].slice(2));
        j++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-1 space-y-1 marker:text-[#c9fdd7]">
          {items.map((it, k) => (
            <li key={k} className="text-[14px] leading-6">{it}</li>
          ))}
        </ul>
      );
      i = j - 1;
    } else if (line.trim() === "") {
      nodes.push(<div key={`br-${i}`} className="h-2" />);
    } else {
      nodes.push(
        <div key={`p-${i}`} className="text-[14px] leading-6">
          {line}
        </div>
      );
    }
  }
  return nodes;
}

export default function ChatBubble({
  role,
  content,
}: {
  role: string;
  content: string;
}) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={clsx(
        "rounded-2xl px-4 py-3",
        "border",
        isAssistant
          ? "bg-[#0f1713] border-[#1f3b2d]"
          : "bg-[#101417] border-[#1b2831]"
      )}
    >
      <div className="mb-1 text-[11px] uppercase tracking-wider text-[#7ea293]">
        {isAssistant ? "CAPITALIZE" : role}
      </div>
      <div className="text-[#e9fff4]">
        {renderWithHeadings(content || "")}
      </div>
    </div>
  );
}
