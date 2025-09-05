"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop vendor + host details (names, contacts, event info) and I’ll draft a tight intro.",
  vendor:
    "Vendor console: paste event facts (date, headcount, budget, location, notes) and I’ll draft a clean, sendable proposal.",
  host:
    "Tell me the plan (event, date, headcount, budget, location, vibe) and I’ll spin up a clear vendor request or proposal.",
};

async function callApi(messages, role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  return data.reply || "I’m ready — share details and I’ll draft the next step.";
}

export default function AIChatPage({ role = "referrer", header = "Referrer Console" }) {
  const [messages, setMessages] = useState([
    { role: "ai", content: seeds[role] || seeds.referrer },
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const taRef = useRef(null);

  // Auto-grow textarea (capped)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [input]);

  function pushMsg(role, content) {
    setMessages((m) => [...m, { role, content }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    pushMsg("user", text);
    setBusy(true);

    try {
      const reply = await callApi([...messages, { role: "user", content: text }], role);
      pushMsg("ai", reply);
    } catch {
      pushMsg(
        "ai",
        "_Couldn’t reach the server. Paste your event details (event / date / headcount / budget / location / notes) and I’ll structure a clean message._"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 rounded-2xl bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100 shadow-xl ring-1 ring-neutral-800">
      <div className="text-[22px] font-semibold mb-3 tracking-tight">
        {header}
      </div>

      <div className="space-y-3 mb-4 max-h-[60vh] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "user" ? "user" : "ai"} content={m.content} />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type to brief the co-pilot…  (/search, /news, /maps supported) — Cmd/Ctrl+Enter to send"
          className="flex-1 min-h-[44px] max-h-[220px] resize-none rounded-xl bg-neutral-900 text-neutral-100 placeholder-neutral-500 border border-neutral-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60 hover:bg-emerald-500 transition"
          aria-label="Send"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>

      {role === "referrer" && (
        <div className="mt-5">
          <LeadQuickCapture
            onDraft={(lines) => {
              pushMsg("user", "(Draft intro)");
              pushMsg("ai", lines.join("\n"));
            }}
          />
        </div>
      )}
    </div>
  );
}
