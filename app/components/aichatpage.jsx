"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop in vendor + host details (names, contacts, event info) and I’ll draft the intro for you.",
  vendor:
    "Welcome to your vendor console. Paste event details (date, headcount, budget, location, notes) and I’ll draft a clean proposal you can send.",
  host:
    "Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe) and I’ll generate a vendor request or proposal.",
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

  // Grow textarea with content
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px"; // cap height
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
    } catch (err) {
      pushMsg(
        "ai",
        "_Couldn’t reach the server. Paste your event details (event / date / headcount / budget / location / notes) and I’ll structure a clean message._"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 bg-neutral-900 text-white rounded-xl shadow-lg">
      <div className="text-xl font-semibold mb-4">{header}</div>

      <div className="space-y-3 mb-4 max-h-[60vh] overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role === "user" ? "user" : "ai"}
            content={m.content}
          />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // ENTER inserts newline; Ctrl/Cmd+Enter sends
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your message… (/search, /news, /maps supported)"
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-xl bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 px-3 py-2"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
          aria-label="Send"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>

      {/* Referrer quick-capture form under chat */}
      {role === "referrer" && (
        <LeadQuickCapture
          onDraft={(lines) => {
            pushMsg("user", "(Draft intro)");
            pushMsg("ai", lines.join("\n"));
          }}
        />
      )}
    </div>
  );
}
