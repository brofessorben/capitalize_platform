"use client";

import React from "react";

type Props = {
  role: "assistant" | "referrer" | "vendor" | "host";
  content: string;
};

/** Strip markdown, normalize hyphen/asterisk bullets to real bullets */
function normalize(text: string) {
  return text
    .replace(/\*\*/g, "")                // kill markdown bold markers
    .replace(/^\s*[-*]\s+/gm, "• ");     // convert - / * bullets to "• "
}

/** Render text into headings, lists (only if 3+ items), or paragraphs */
function renderBlocks(text: string) {
  const blocks = normalize(text).split(/\n{2,}/); // split on blank lines

  return blocks.map((block, idx) => {
    const lines = block.split("\n").filter(Boolean);

    const isBullet = (l: string) => /^•\s/.test(l);
    const bulletCount = lines.filter(isBullet).length;

    // Only render as UL if 3+ bullets; otherwise show as sentences
    if (bulletCount >= 3 && bulletCount === lines.length) {
      return (
        <ul key={idx} className="list-disc pl-5 space-y-1">
          {lines.map((l, i) => (
            <li key={i}>{l.replace(/^•\s?/, "")}</li>
          ))}
        </ul>
      );
    }

    // Section heading: short single line ending with colon
    if (
      lines.length === 1 &&
      /:$/m.test(lines[0]) &&
      lines[0].length <= 60 &&
      !isBullet(lines[0])
    ) {
      return (
        <h4
          key={idx}
          className="text-[15px] font-semibold tracking-wide mb-1 text-[#e9ffe7]"
        >
          {lines[0]}
        </h4>
      );
    }

    // Special styling for the final "Next step:" line if it comes alone
    if (
      lines.length === 1 &&
      /^Next step:/i.test(lines[0]) &&
      !isBullet(lines[0])
    ) {
      return (
        <p key={idx} className="whitespace-pre-wrap leading-relaxed font-medium">
          {lines[0]}
        </p>
      );
    }

    // If there are 1–2 bullet lines, show as normal sentences (no list UI)
    if (bulletCount > 0 && bulletCount < 3) {
      const cleaned = lines.map((l) => l.replace(/^•\s?/, "— ")).join("\n");
      return (
        <p key={idx} className="whitespace-pre-wrap leading-relaxed">
          {cleaned}
        </p>
      );
    }

    // Default paragraph, preserve newlines
    return (
      <p key={idx} className="whitespace-pre-wrap leading-relaxed">
        {block}
      </p>
    );
  });
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
      <div
        className={bubble}
        style={{
          fontFamily:
            "system-ui, ui-rounded, Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div className="space-y-2 text-[15px]">{renderBlocks(content)}</div>
      </div>
    </div>
  );
}
