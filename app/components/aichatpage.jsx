"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture"; // keep if you have it

// Role presets (quick, helpful, a little cheeky)
const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop in vendor + host details (names, contacts, event info) and I’ll draft the intro for you. Ask me anything.",
  vendor:
    "Welcome to your vendor console. Paste the lead (event, date, headcount, budget, location, notes). I’ll turn it into a clean reply/proposal.",
  host:
    "Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll draft outreach to vendors—fast.",
};

// Call your API route (supports slash commands handled on the server)
async function callChatAPI(messages, role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  // Server responds as { reply: string }
  return data.reply || "I’m here—drop details and I’ll draft the next move.";
}

export default function AIChatPage({
  role = "referrer",
  header = "Referrer Console",
}) {
  const [messages, setMessages] = useState([
    { role: "ai", content: seeds[role] || seeds.referrer },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const taRef = useRef(null);
  const listRef = useRef(null);

  // Autosize textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [input]);

  // Scroll to bottom on new message
  useEffect(() => {
    const box = listRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, busy]);

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
      const reply = await callChatAPI(
        [...messages, { role: "user", content: text }],
        role
      );
      push("ai", reply);
    } catch (e) {
      push(
        "ai",
        "_Couldn’t reach the server. One sec—try again in a moment. If this keeps happening, ping the team._"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      {/* Card container */}
      <div className="rounded-2xl bg-neutral-900/80 ring-1 ring-neutral-800 shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold text-white">{header}</h1>
          <span className="text-xs text-neutral-400 hidden md:block">
            Pro tip: <code className="bg-neutral-800 px-1 rounded">/search</code>,{" "}
            <code className="bg-neutral-800 px-1 rounded">/news</code>,{" "}
            <code className="bg-neutral-800 px-1 rounded">/maps</code> are supported.
          </span>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="px-4 md:px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto scroll-smooth"
        >
          {messages.map((m, i) => (
            <ChatBubble
              key={i}
              role={m.role === "user" ? "user" : "ai"}
              content={m.content}
              // ChatBubble should already style; we keep spacing tight
            />
          ))}
          {busy && <ChatBubble role="ai" content="_Typing…_" />}
        </div>

        {/* Composer */}
        <div className="px-4 md:px-5 py-4 border-t border-neutral-800 flex items-end gap-2">
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
            className="flex-1 min-h-[44px] max-h-[220px] resize-none rounded-xl bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 px-3 py-2"
          />
          <button
            onClick={send}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-60 transition"
            aria-label="Send"
          >
            {busy ? "…" : "Send"}
          </button>
        </div>
      </div>

      {/* Lead form under chat (only for referrers) */}
      {role === "referrer" && typeof LeadQuickCapture !== "undefined" && (
        <div className="mt-6">
          <LeadQuickCapture
            onDraft={(lines) => {
              // quick helper for demos: drop a polished draft
              push("user", "(Draft intro)");
              push("ai", lines.join("\n"));
            }}
          />
        </div>
      )}
    </div>
  );
}
