"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "@/app/components/ChatBubble";
import LeadQuickCapture from "@/app/components/LeadQuickCapture";

const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop the **vendor** + **host** details (names, contact, date, headcount, budget, notes). I’ll draft the intro and keep momentum.\n\n**Commands:**\n- `/search query` web search\n- `/news query` news search\n- `/maps query` Google Maps/Places\n\nEnter = newline • Cmd/Ctrl+Enter = Send",
  vendor:
    "Vendor console ready. Paste the lead details (event, date, headcount, budget, location, notes) and I’ll draft a clean reply/proposal you can send.",
  host:
    "Host console ready. Tell me the event (date, headcount, budget, location, vibe). I’ll generate a clean vendor request or proposal.",
};

export default function AIChatPage({ role = "referrer", header = "Referrer Console" }) {
  const [messages, setMessages] = useState([{ role: "ai", content: seeds[role] || seeds.referrer }]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const taRef = useRef(null);

  // auto-grow textarea up to 240px
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }], role }),
      });
      const data = await res.json();
      push("ai", data.reply || "I’m here—share details and I’ll draft the next message.");
    } catch {
      push("ai", "_Couldn’t reach the server. Try again in a moment._");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[80vh] w-full mx-auto max-w-4xl p-4 md:p-6 rounded-2xl bg-neutral-900 text-neutral-100">
      {/* Header */}
      <div className="text-2xl font-semibold mb-4">{header}</div>

      {/* Chat stream */}
      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "user" ? "user" : "ai"} content={m.content} />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 sticky bottom-4">
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
          placeholder="Type your message… (Cmd/Ctrl+Enter to send)"
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-xl bg-neutral-800 text-neutral-100 placeholder-neutral-400 border border-neutral-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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

      {/* Lead form (referrer only) */}
      {role === "referrer" && (
        <div className="mt-6">
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
