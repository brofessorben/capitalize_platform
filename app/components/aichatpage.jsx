"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture"; // keep if present

const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop in **vendor + host** details (names, contacts, event info) and I’ll draft the intro for you.",
  vendor:
    "Welcome to your vendor console. Paste the lead details (event, date, headcount, budget, location, notes) and I’ll draft a sharp reply or proposal.",
  host:
    "Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll generate a clean vendor request.",
};

async function callChatAPI(messages, role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("bad status");
  const json = await res.json();
  return json.reply || "_I’m ready—share details and I’ll draft the next message._";
}

export default function AIChatPage({ role = "referrer", header = "Referrer Console" }) {
  const [messages, setMessages] = useState([{ role: "ai", content: seeds[role] || seeds.referrer }]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const taRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  function push(role, content) {
    setMessages((m) => [...m, { role, content }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    push("user", text);
    setBusy(true);

    try {
      const reply = await callChatAPI([...messages, { role: "user", content: text }], role);
      push("ai", reply);
    } catch {
      push(
        "ai",
        "_Couldn’t reach the server. Try again in a moment._"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-3 text-neutral-100">{header}</div>

      <div className="space-y-3 mb-3">
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
          placeholder="Type it. I’ll make it shine. (Cmd/Ctrl+Enter to send)"
          className="flex-1 min-h-[44px] max-h-[200px] resize-none rounded-xl bg-neutral-900 text-neutral-100 placeholder-neutral-500 border border-neutral-700 hover:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 px-3 py-2"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60 shadow"
          aria-label="Send"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>

      {/* Referrer-only helper block */}
      {role === "referrer" && typeof LeadQuickCapture !== "undefined" && (
        <div className="mt-5">
          <LeadQuickCapture
            onDraft={(lines) => {
              push("user", "(Draft intro)");
              push("ai", lines.join("\n"));
            }}
          />
        </div>
      )}
    </div>
  );
}
