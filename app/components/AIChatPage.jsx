"use client";

import { useState } from "react";
import ChatBubble from "./ChatBubble";

// Role-specific welcome
const seed = {
  referrer: [
    "### Referrer Console",
    "Share who you’re connecting and context. I’ll draft a clean intro **or** a full proposal when you paste event info.",
    "- **Vendor**: name + contact",
    "- **Host**: name + phone/email",
    "- **Context**: date, headcount, budget, notes",
  ].join("\n"),
  vendor: [
    "### Vendor Console",
    "Paste the lead details (event, date, headcount, budget, location, notes). I’ll auto-draft a reply/proposal you can send back.",
  ].join("\n"),
  host: [
    "### Host Console",
    "Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll generate a clean vendor proposal you can send.",
  ].join("\n"),
};

// ---------- Simple parsers ----------
function take(s, key) {
  // matches: "Event: something", "event - something", "event=something"
  const re = new RegExp(`(^|\\n)\\s*${key}\\s*[:=\\-]\\s*(.+)`, "i");
  const m = s.match(re);
  return m ? m[2].trim() : "";
}

function parseList(s, key) {
  const raw = take(s, key);
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseEventDraft(text) {
  const t = text.trim();

  // quick keys (users can paste in any order)
  const event = take(t, "event|type|occasion");
  const date = take(t, "date|when");
  const time = take(t, "time");
  const headcount = take(t, "headcount|guests|attendees");
  const budget = take(t, "budget|$|price range|range");
  const location = take(t, "location|venue|city");
  const host = take(t, "host|client|name");
  const vendor = take(t, "vendor|company");
  const phone = take(t, "phone|tel");
  const email = take(t, "email|e-mail");
  const needs = parseList(t, "needs|categories|vendors");
  const notes = take(t, "notes|context|details");

  const coreCount = [event, date, headcount || budget, location].filter(Boolean).length;

  return {
    ok: coreCount >= 3, // enough to make a useful draft
    event,
    date,
    time,
    headcount,
    budget,
    location,
    host,
    vendor,
    phone,
    email,
    needs,
    notes,
  };
}

function makeProposal(d, role) {
  const title =
    role === "vendor"
      ? `### Proposal: ${d.event || "Event"}`
      : `### Draft Intro + Proposal Request`;

  const who =
    role === "vendor"
      ? (d.vendor ? `**From:** ${d.vendor}` : `**From:** Vendor`)
      : (d.host ? `**For:** ${d.host}` : `**For:** Host`);

  const intro =
    role === "vendor"
      ? `Thanks for the opportunity! Here’s a concise proposal based on your details.`
      : `I’d like to connect you with the right vendor(s). Here’s a clean summary you can send:`;

  const items = [
    d.event && `- **Event:** ${d.event}`,
    d.date && `- **Date:** ${d.date}${d.time ? ` at ${d.time}` : ""}`,
    d.location && `- **Location:** ${d.location}`,
    d.headcount && `- **Headcount:** ${d.headcount}`,
    d.budget && `- **Budget:** ${d.budget}`,
    d.needs && d.needs.length > 0 && `- **Needs:** ${d.needs.join(", ")}`,
    d.notes && `- **Notes:** ${d.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  const nextSteps =
    role === "vendor"
      ? [
          "- Confirm availability for the date/time",
          "- Provide pricing that fits the budget (with options if helpful)",
          "- List any assumptions or add-ons (travel, overtime, taxes)",
          "- Share a booking link or next action to lock this in",
        ]
      : [
          "- Reply with availability",
          "- Provide a price that fits the budget (with options if helpful)",
          "- List any assumptions or add-ons (travel, overtime, taxes)",
          "- Include a booking link or the next action",
        ];

  return [
    title,
    "",
    who,
    "",
    "#### Summary",
    items || "- (Add details)",
    "",
    "#### Proposed Scope",
    "- Professional service tailored to the event details",
    "- Clear deliverables, timeline, and point of contact",
    "- Transparent pricing with any add-ons itemized",
    "",
    "#### Next Steps",
    ...nextSteps.map((x) => `- ${x}`),
    "",
    "_(You can copy/paste this directly.)_",
  ].join("\n");
}

// ---------- API fallback ----------
async function callApi(messages, role) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, role }),
    });
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    return data.content || "I’m ready — share details and I’ll draft the next message.";
  } catch {
    return [
      "### Got it",
      "",
      "I couldn’t reach the server, but I can still help. Paste event details like:",
      "- Event: Wedding",
      "- Date: Oct 12, 2026 (5pm)",
      "- Headcount: 150",
      "- Budget: $15–20k",
      "- Location: Austin, TX",
      "- Needs: florist, band, caterer, rentals",
      "- Notes: outdoor, classy, no red roses",
      "",
      "I’ll auto-draft a proposal.",
    ].join("\n");
  }
}

export default function AIChatPage({ role = "referrer", header = "Console" }) {
  const [messages, setMessages] = useState([
    { role: "ai", content: seed[role] || seed.referrer },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    // 1) Try proposal path first
    const parsed = parseEventDraft(text);
    if (parsed.ok) {
      const proposal = makeProposal(parsed, role);
      setMessages((m) => [...m, { role: "ai", content: proposal }]);
      setBusy(false);
      return;
    }

    // 2) Otherwise, call API (open chat)
    const reply = await callApi(next, role);
    setMessages((m) => [...m, { role: "ai", content: reply }]);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-white">{header}</div>

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "user" ? "user" : "ai"} content={m.content} />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 bg-neutral-800 text-white placeholder-neutral-400 border-neutral-700"
          placeholder="Type details—I'll auto-draft a proposal if I detect enough info"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={busy}
        />
        <button
          onClick={handleSend}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
