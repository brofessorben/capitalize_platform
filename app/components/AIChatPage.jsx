"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Ask me anything or tell me who you’re connecting. I’ll help draft the intro and keep momentum. For referrers: include the **vendor name + contact**, plus the **host name + phone/email** and any context (date, headcount, budget). I’ll draft the intro and we’ll take it from there.",
  vendor:
    "Welcome to your vendor console. Paste the lead details (event, date, headcount, budget, location, notes) and I’ll draft a clean reply/proposal you can send.",
  host:
    "Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll generate a clean vendor request or proposal.",
};

// API call
async function callApi(messages, role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  return data.content || "I’m ready — share details and I’ll draft the next message.";
}

// naive parser to pull emails, phones, budget, headcount, date
function parseFields(text) {
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
  const phone = text.match(/(\+?\d[\d\-\s]{7,}\d)/)?.[0];
  const budget = text.match(/\$?\d+(?:,\d{3})*(?:\.\d{2})?/g)?.[0];
  const headcount = text.match(/\b\d{2,4}\b/)?.[0];
  const date = text.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/)?.[0];
  const website = text.match(/https?:\/\/[^\s]+/)?.[0];
  return { email, phone, budget, headcount, date, website };
}

export default function AIChatPage({ role = "referrer", header = "Referrer Console" }) {
  const [messages, setMessages] = useState([{ role: "ai", content: seeds[role] || seeds.referrer }]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const taRef = useRef(null);

  // autosize textarea
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "0px";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 240) + "px";
  }, [input]);

  // always scroll to bottom
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      // parse details and broadcast to LeadQuickCapture
      const parsed = parseFields(text + " " + reply);
      if (Object.values(parsed).some(Boolean)) {
        window.dispatchEvent(new CustomEvent("ai-fill-lead", { detail: parsed }));
      }
    } catch {
      pushMsg("ai", "I couldn’t reach the server. Paste your details and I’ll structure a clean message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-white">{header}</div>

      <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "user" ? "user" : "ai"} content={m.content} />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
        <div ref={bottomRef} />
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
          placeholder="Type your message…"
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-xl bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 px-3 py-2"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>

      {role === "referrer" && <LeadQuickCapture />}
    </div>
  );
}
