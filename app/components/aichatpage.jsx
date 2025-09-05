"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture"; // keep if you have it
// If you don't have this component, remove the block that renders it below.

type Role = "referrer" | "vendor" | "host";

const seeds: Record<Role, string> = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Tell me who you’re connecting (vendor + host) and any context (event, date, headcount, budget). I’ll draft the intro and keep momentum.",
  vendor:
    "Welcome to your vendor console. Paste the lead details (event, date, headcount, budget, location, notes) and I’ll draft a tight reply/proposal you can send.",
  host:
    "Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll generate a clean vendor request or proposal.",
};

async function callChatAPI(messages: Array<{ role: string; content: string }>, role: Role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  // API returns { reply: string }
  return String(data.reply ?? "");
}

export default function AIChatPage({
  role = "referrer",
  header = "Referrer Console",
}: {
  role?: Role;
  header?: string;
}) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; content: string }>>([
    { role: "ai", content: seeds[role] || seeds.referrer },
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow textarea up to 240px
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [input]);

  const pushMsg = (r: "user" | "ai", c: string) =>
    setMessages((m) => [...m, { role: r, content: c }]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    pushMsg("user", text);
    setBusy(true);

    try {
      // Chat with OpenAI (API also handles /search, /news, /maps)
      const reply = await callChatAPI(
        [...messages, { role: "user", content: text }],
        role
      );
      pushMsg("ai", reply);

      // Try to sniff out structured “lead” info from the assistant reply to auto-fill the bottom form.
      // We look for simple lines like "Event:", "Date:", etc. If found, emit a custom event.
      const auto = extractLeadDraft(reply);
      if (auto && Object.keys(auto).length) {
        // Let any form below listen for this
        window.dispatchEvent(new CustomEvent("ai:draft", { detail: auto }));
      }
    } catch {
      pushMsg(
        "ai",
        [
          "### I’m here",
          "",
          "I couldn’t reach the server just now.",
          "Paste your details (event / date / headcount / budget / location / notes) and I’ll structure a clean message.",
        ].join("\n")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-white">{header}</div>

      {/* Chat stream */}
      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role}
            content={String(m.content ?? "")}
          />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
      </div>

      {/* Composer */}
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
          placeholder="Type your message…  (/search bbq Nashville · /news AI events · /maps bars downtown)"
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-xl bg-neutral-900 text-white placeholder-neutral-400 border border-neutral-800 px-3 py-2"
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

      {/* Optional: lead quick capture block */}
      {role === "referrer" && typeof LeadQuickCapture !== "undefined" && (
        <div className="mt-4">
          <LeadQuickCapture
            onDraft={(lines: string[]) => {
              // show the draft in the chat
              pushMsg("user", "(Draft intro)");
              pushMsg("ai", lines.join("\n"));
              // also broadcast it for any form listener
              window.dispatchEvent(
                new CustomEvent("ai:draft", {
                  detail: coerceDraftLines(lines),
                })
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Try to pull simple fields from the assistant reply and emit as a draft object. */
function extractLeadDraft(text: string) {
  const out: Record<string, string> = {};
  const map: Record<string, RegExp> = {
    event: /^event\s*:\s*(.+)$/im,
    date: /^date\s*:\s*(.+)$/im,
    headcount: /^headcount\s*:\s*(.+)$/im,
    budget: /^budget\s*:\s*(.+)$/im,
    location: /^location\s*:\s*(.+)$/im,
    notes: /^notes?\s*:\s*(.+)$/im,
    hostName: /^host\s*name\s*:\s*(.+)$/im,
    hostEmail: /^host\s*email\s*:\s*(.+)$/im,
    hostPhone: /^host\s*phone\s*:\s*(.+)$/im,
    vendorName: /^vendor\s*name\s*:\s*(.+)$/im,
    vendorEmail: /^vendor\s*email\s*:\s*(.+)$/im,
  };
  for (const [key, rx] of Object.entries(map)) {
    const m = text.match(rx);
    if (m && m[1]) out[key] = m[1].trim();
  }
  return out;
}

/** If LeadQuickCapture hands us lines of "Field: value", turn into a draft object. */
function coerceDraftLines(lines: string[]) {
  const out: Record<string, string> = {};
  for (const raw of lines) {
    const m = raw.match(/^\s*([^:]+):\s*(.+)\s*$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}
