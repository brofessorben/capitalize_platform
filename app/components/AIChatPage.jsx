"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatBubble from "@/app/components/ChatBubble";
import LeadQuickCapture from "@/app/components/LeadQuickCapture";

const SEEDS = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop who you’re connecting and any context. For referrers, include the **vendor name + contact**, the **host name + phone/email**, and details like **date, headcount, budget, location, notes**. I’ll draft a clean intro or a full proposal.",
  vendor:
    "Vendor console ready. Paste the lead details (event, date, headcount, budget, location, notes) and I’ll draft a polished reply/proposal you can send.",
  host:
    "Host console ready. Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll generate a clean vendor request or proposal.",
};

async function callChatAPI(messages, role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("Bad status");
  const data = await res.json();
  // Compatible with your /api/chat shape: prefer .content, fall back to .reply
  return data.content || data.reply || "I’m ready — share details and I’ll draft the next message.";
}

/** very light extraction to prefill the lead form */
function extractLeadFields(text) {
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])[0] || "";
  const phone = (text.match(/(\+?\d[\d\-\s().]{7,}\d)/g) || [])[0] || "";
  const headcount = (text.match(/\b(\d{2,4})\s*(guests|ppl|people|attendees|heads?)\b/i) || [])[1] || "";
  const budget =
    (text.match(/\$?\s?(\d{3,6})(?:\s*-\s*\$?\d{3,6})?\s*(?:budget|total)?/i) || [])[1] || "";
  const date =
    (text.match(/\b(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\s+\d{1,2}(?:,\s*\d{4})?)\b/) ||
      [])[0] || "";
  const website = (text.match(/\bhttps?:\/\/[^\s]+/i) || [])[0] || "";

  return { email, phone, headcount, budget, date, website };
}

export default function AIChatPage({
  role = "referrer",
  header = "Referrer Console",
}) {
  const firstMsg = useMemo(
    () => ({ role: "ai", content: SEEDS[role] || SEEDS.referrer }),
    [role]
  );

  const [messages, setMessages] = useState([firstMsg]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");

  const taRef = useRef(null);
  const scrollerRef = useRef(null);

  // autosize the textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px"; // cap
  }, [input]);

  // auto-scroll to bottom on new messages
  useEffect(() => {
    const wrap = scrollerRef.current;
    if (!wrap) return;
    wrap.scrollTop = wrap.scrollHeight;
  }, [messages, busy]);

  function push(role, content) {
    setMessages((m) => [...m, { role, content }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    // optimistic UI
    setInput("");
    push("user", text);
    setBusy(true);

    // emit extraction to allow the form to prefill
    const extracted = extractLeadFields(text);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ai-fill-lead", { detail: extracted })
      );
    }

    try {
      const reply = await callChatAPI([...messages, { role: "user", content: text }], role);
      push("ai", reply);
    } catch {
      push(
        "ai",
        [
          "### Got it",
          "",
          "I couldn’t reach the server just now, but I’m still here.",
          "Paste details (event / date / headcount / budget / location / notes) and I’ll structure a clean message.",
        ].join("\n")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-white">{header}</div>

      {/* chat history */}
      <div
        ref={scrollerRef}
        className="space-y-3 mb-4 max-h-[60vh] overflow-y-auto pr-1"
      >
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role === "user" ? "user" : "ai"}
            content={m.content}
          />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_"/>}
      </div>

      {/* input row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter = newline; Cmd/Ctrl+Enter = send
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your message… (headings & bullets supported)"
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

      {/* lead form block under chat (referrer only) */}
      {role === "referrer" && (
        <div className="mt-6">
          <LeadQuickCapture
            onDraft={(lines) => {
              // show the generated intro/proposal back in chat
              push("user", "(Draft intro)");
              push("ai", lines.join("\n"));
            }}
            onAiExtract={(fields) => {
              // optional: if your form component supports this
              // do nothing here; LeadQuickCapture can listen to the window event above instead.
              return fields;
            }}
          />
        </div>
      )}
    </div>
  );
}
