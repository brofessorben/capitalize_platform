"use client";

import { useState } from "react";
import ChatBubble from "./ChatBubble";

const seed = {
  referrer: [
    "### Referrer Console\n",
    "Drop who you’re connecting and any context. I’ll draft a clean intro and keep momentum.\n",
    "- **Vendor**: name + contact\n",
    "- **Host**: name + phone/email\n",
    "- **Context**: date, headcount, budget, notes\n",
    "\nI’ll return a message you can copy/paste, plus next steps."
  ].join("\n"),
  vendor: [
    "### Vendor Console\n",
    "Tell me the lead details and what you offer. I’ll prep a tight reply and surface gaps.\n",
    "- **Offer**: packages, min spend, travel fees\n",
    "- **Availability**: dates/times\n",
    "- **Questions**: missing info I should ask for\n",
    "\nI’ll format a professional response for the host/referrer."
  ].join("\n"),
  host: [
    "### Host Console\n",
    "Tell me what you’re planning. I’ll gather quotes and coordinate intros.\n",
    "- **Event**: type, date, headcount\n",
    "- **Needs**: vendors, budget ranges\n",
    "- **Preferences**: vibe, must-haves\n",
    "\nI’ll turn this into requests vendors can instantly act on."
  ].join("\n"),
};

async function callApi(messages, role) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, role }),
    });
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    // expect { content: string } or similar
    return data.content || "I’m ready. Share details and I’ll draft the next message.";
  } catch {
    // fallback canned reply with formatting
    return [
      "### Got it",
      "",
      "Here’s how I’ll proceed:",
      "- Capture the details",
      "- Draft a concise message",
      "- Keep the momentum between parties",
      "",
      "**Next step:** paste the specifics and I’ll tailor it."
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

    const reply = await callApi(next, role);
    setMessages((m) => [...m, { role: "ai", content: reply }]);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-gray-900">{header}</div>

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "user" ? "user" : "ai"} content={m.content} />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 bg-white text-gray-900"
          placeholder="Type your message… (headings & bullets supported)"
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
