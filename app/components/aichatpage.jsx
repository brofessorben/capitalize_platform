"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./chatbubble";
import LeadQuickCapture from "./leadquickcapture";

const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Tell me who you’re connecting (vendor + host) and I’ll draft the intro.",
  vendor:
    "Vendor console online. Paste event details (event, date, headcount, budget, location, notes) and I’ll spin a proposal.",
  host:
    "Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe) and I’ll help you find vendors.",
};

function storageKey(role, leadId) {
  return `chat:${role || "general"}:${leadId || "inbox"}`;
}

async function callChatAPI(messages, role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  return data.reply;
}

export default function AIChatPage({
  role = "referrer",
  header = "Console",
  leadId = null,
  showLeadForm = false,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);

  // load existing chat for this role+lead
  useEffect(() => {
    const key = storageKey(role, leadId);
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (raw) {
      try {
        setMessages(JSON.parse(raw));
      } catch {
        setMessages([{ role: "assistant", content: seeds[role] }]);
      }
    } else {
      setMessages([{ role: "assistant", content: seeds[role] }]);
    }
  }, [role, leadId]);

  // persist on change
  useEffect(() => {
    const key = storageKey(role, leadId);
    if (messages?.length) {
      localStorage.setItem(key, JSON.stringify(messages));
    }
  }, [messages, role, leadId]);

  // keep scrolled to bottom
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await callChatAPI(next, role);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "_Couldn’t reach the server. Try again in a bit. Paste details and I’ll draft it anyway._",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-4 rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-4 text-green-400">
        {header}
        {leadId ? <span className="text-gray-400 text-sm ml-2">#{leadId}</span> : null}
      </h1>

      <div ref={scroller} className="flex-1 overflow-y-auto space-y-3 bg-gray-800 p-3 rounded">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {busy && <ChatBubble role="assistant" content="_Typing…_" />}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <textarea
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-xl bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message… (Shift+Enter = newline, Cmd/Ctrl+Enter = send)"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
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

      {showLeadForm && (
        <div className="mt-4">
          <LeadQuickCapture />
        </div>
      )}
    </div>
  );
}
