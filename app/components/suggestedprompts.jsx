"use client";

import React from "react";

export default function SuggestedPrompts({
  role = "referrer",
  onPick,
  compact = false,
}) {
  // Role-aware seed suggestions (tweak freely)
  const bank = {
    referrer: [
      "Draft an intro between Ben (vendor) and Amy (host)",
      "Summarize this lead and list next steps",
      "Find 3 Nashville BBQ trucks with menus",
      "Turn this into a text I can send",
      "Write a tight follow-up w/ urgency",
    ],
    vendor: [
      "Turn these details into a proposal",
      "Ask 5 clarifying questions (budget, headcount, service style…)",
      "Generate 3 menu packages: good/better/best",
      "Spin a short pitch email",
      "Create a task list for my team",
    ],
    host: [
      "Turn this plan into a clean vendor request",
      "Suggest 3 vendors that match this vibe + budget",
      "Make a timeline for the day",
      "Write a polite ‘what’s your availability?’ message",
      "List hidden costs to watch for",
    ],
  };

  const items = bank[role] || bank.referrer;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-3"}`}>
      {items.map((t, i) => (
        <button
          key={i}
          onClick={() => onPick?.(t)}
          className="rounded-full px-3 py-1 text-sm bg-[#0f1a14] border border-[#1f3b2d] text-[#c9fdd7] hover:bg-[#143021] transition"
          title={t}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
