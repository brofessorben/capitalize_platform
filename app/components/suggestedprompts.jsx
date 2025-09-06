// app/components/suggestedprompts.jsx
"use client";
import React from "react";

export default function SuggestedPrompts({ role = "referrer", onPick, compact = false, items }) {
  const bank = {
    referrer: [
      "Draft an intro between vendor + host",
      "Summarize this lead and next steps",
      "Find 3 local vendors with menus",
      "Turn this into a text I can send",
      "Write a tight follow-up",
    ],
    vendor: [
      "Turn details into a proposal",
      "Ask 5 clarifying questions",
      "Good/Better/Best packages",
      "Short pitch email",
      "Team task checklist",
    ],
    host: [
      "Turn plan into vendor request",
      "Suggest 3 matched vendors",
      "Make a timeline",
      "Polite availability check",
      "List hidden costs",
    ],
  };

  const list = items && items.length ? items : bank[role] || bank.referrer;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-4"}`}>
      {list.map((t, i) => (
        <button
          key={`${i}-${t.slice(0, 10)}`}
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
