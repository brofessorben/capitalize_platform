"use client";
import React, { useMemo } from "react";

/** Quick & dirty context-based prompt generator */
function fromContext(last = "", role = "referrer") {
  const seed = {
    referrer: [
      "Draft an intro between vendor + host",
      "Summarize this lead and next steps",
      "Find 3 local vendors with menus",
      "Turn this into a text I can send",
      "Write a tight follow-up",
    ],
    vendor: [
      "Turn these details into a proposal",
      "Ask 5 clarifying questions",
      "Create 3 package options (good/better/best)",
      "Draft a short pitch email",
      "Make a team task list",
    ],
    host: [
      "Turn this plan into a clean vendor request",
      "Suggest 3 vendors that match vibe + budget",
      "Make a day-of timeline",
      "Write a polite availability check",
      "List hidden costs to watch for",
    ],
  };

  const s = last.toLowerCase();

  // very light heuristics
  if (/bbq|cater|menu|food truck|chef/.test(s))
    return ["Compare 3 menu options", "Draft outreach to the top pick", "Ask about dietary restrictions"];
  if (/budget|price|cost/.test(s))
    return ["Give a budget breakdown", "Offer 3 tiers with pricing", "Call out hidden fees"];
  if (/date|timeline|schedule/.test(s))
    return ["Propose a timeline", "Check vendor availability", "List prep tasks due this week"];
  if (/venue|location|nashville|address/.test(s))
    return ["Map vendors near the venue", "Draft a driving/delivery note", "Ask for venue restrictions"];

  return seed[role] || seed.referrer;
}

export default function SuggestedPrompts({ role = "referrer", lastMessage = "", onPick, compact = false }) {
  const items = useMemo(() => fromContext(lastMessage, role), [lastMessage, role]);

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
