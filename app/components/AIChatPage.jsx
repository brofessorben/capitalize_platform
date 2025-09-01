"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Full-page AI chat with a small stats/header row.
 * Props:
 * - title: string (page title)
 * - userId: string (for future multi-user logic)
 * - role: "referrer" | "vendor" | "host" | "landing"
 * - leadId: optional string to thread a specific lead
 * - headerContent: optional React node for KPI mini-cards
 */
export default function AIChatPage({
  title = "Ask AI",
  userId = "dev-ben",
  role = "landing",
  leadId = "",
  headerContent = null,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);

  // Load history (scoped by lead if provided, else by role+user)
  useEffect(() => {
    const query = leadId ? `lead_id=${encodeURIComponent(leadId)}` : `lead_id=${encodeURIComponent(`${role}:${userId}`)}`;
    fetch(`/api/messages?${query}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, [leadId, role, userId]);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const grouped = useMemo(() => {
    const out = [];
    let last = null;
    for (const m of messages) {
      const t = new Date(m.created_at || Date.now());
      const key = `${m.sender}-${t.getHours()}:${t.getMinutes()}`;
      if (!last || last.key !== key) {
        last = { key, sender: m.sender, when: t, items: [] };
        out.push(last);
      }
      last.items.push(m);
    }
    return out;
  }, [messages]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const threadId = leadId || `${role}:${userId}`;

    // optimistic add (user)
    const optimistic = {
      sender: role === "landing" ? "user" : role, // show who is talking
      role: "user",
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: threadId, sender: optimistic.sender, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chat error");

      // append AI reply
      setMessages((m) => [
        ...m,
        {
          sender: "ai",
          role: "assistant",
          text: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      alert(err.message || "Error");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) sendMessage(e);
  }

  const accent =
    role === "vendor" ? "emerald" :
    role === "host" ? "amber" :
    role === "referrer" ? "purple" :
    "sky";

  return (
    <div className="min-h-dvh bg-black text-neutral-100 flex flex-col">
      {/* Top bar with title + Powered by OpenAI + floating CTA icon top-left */}
      <div className="sticky top-0 z-30 border-b border-neutral-900 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          {/* Big pulsing icon left over the title */}
          <div
            className={`shrink-0 h-10 w-10 rounded-xl grid place-items-center ring-1 ring-neutral-800 bg-neutral-950 shadow-md animate-pulse`}
            title="Ask AI (Powered by OpenAI)"
            aria-hidden
          >
            {/* simple "GPT swirl" vibe with CSS only */}
            <div className="relative h-6 w-6">
              <span className="absolute inset-0 rounded-full border border-neutral-500/70" />
              <span className="absolute inset-1 rounded-full border border-neutral-700/70" />
              <span className="absolute inset-2 rounded-full border border-neutral-800/80" />
            </div>
          </div>

          <div className="flex-1">
            <div className="text-lg font-semibold leading-tight">{title}</div>
            <div className="text-[11px] text-neutral-400">Powered by OpenAI • {role}{userId ? ` • ${userId}` : ""}</div>
          </div>

          {/* (Optional) quick actions could sit on the right later */}
        </div>
        {/* Mini KPI row */}
        {headerContent && (
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <div className="grid gap-3 sm:grid-cols-3">{headerContent}</div>
          </div>
        )}
      </div>

      {/* Chat thread */}
      <div className="mx-auto max-w-4xl w-full px-4 py-4 flex-1">
        <div
          ref={scrollerRef}
          className="h-[66vh] md:h-[70vh] border border-neutral-900 rounded-2xl bg-neutral-950/60 p-4 overflow-y-auto shadow-inner"
        >
          {grouped.length === 0 && (
            <EmptyState
              onClick={() =>
                setInput("Help me draft a referral: host is Acme Corp, 120 guests, June 14 evening, needs catering + bartender.")
              }
              accent={accent}
            />
          )}

          <div className="space-y-4">
            {grouped.map((g, idx) => (
              <MessageGroup key={idx} sender={g.sender} when={g.when} items={g.items} />
            ))}
          </div>
        </div>

        {/* Composer */}
        <form onSubmit={sendMessage} className="mt-4 flex items-end gap-2">
          <textarea
            className="flex-1 border border-neutral-900 rounded-2xl bg-black/60 p-3 min-h-[52px] max-h-40 resize-y focus:outline-none focus:ring-2 focus:ring-white/10 placeholder:text-neutral-500"
            placeholder='Ask a question! e.g. "Draft a vendor proposal", "Summarize this lead", "What do referrers earn?"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            disabled={sending || input.trim() === ""}
            className={`shrink-0 px-5 h-12 rounded-2xl bg-${accent}-600 text-white font-medium disabled:opacity-50`}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>

        <div className="mt-2 text-xs text-neutral-500">
          Tip: Describe who you are (Referrer/Vendor/Host) and what you want. I’ll draft messages, proposals, and next steps.
        </div>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */
function MessageGroup({ sender, when, items }) {
  const meta = getSenderMeta(sender);
  const align = sender === "ai" ? "items-start" : "items-end";
  const bubbleBase =
    "px-3 py-2 rounded-2xl shadow-sm border text-sm whitespace-pre-wrap break-words max-w-[75%]";

  return (
    <div className={`flex ${align} gap-3`}>
      {sender === "ai" ? <Avatar meta={meta} /> : <div className="w-8" />}
      <div className="flex flex-col gap-1">
        <div className="text-[11px] text-neutral-400">
          {meta.label} • {formatTime(when)}
        </div>
        {items.map((m, i) => (
          <div
            key={i}
            className={`${bubbleBase} ${
              sender === "ai"
                ? "bg-black/50 border-neutral-900"
                : sender === "vendor"
                ? "bg-emerald-600 text-white border-emerald-700"
                : sender === "host"
                ? "bg-amber-600 text-white border-amber-700"
                : "bg-purple-600 text-white border-purple-700"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      {sender !== "ai" ? <Avatar meta={meta} right /> : <div className="w-8" />}
    </div>
  );
}

function Avatar({ meta, right = false }) {
  return (
    <div className={`w-8 h-8 rounded-xl grid place-items-center ${right ? "" : ""} ${meta.color} text-white`}>
      <span className="text-base" title={meta.label}>{meta.badge}</span>
    </div>
  );
}

function EmptyState({ onClick, accent = "purple" }) {
  return (
    <div className="h-full grid place-items-center">
      <div className="text-center">
        <div className="text-6xl">💬</div>
        <div className="mt-2 font-semibold">Start the conversation</div>
        <div className="text-sm text-neutral-400">Ask about referrals, proposals, payouts, or anything app-related.</div>
        <button
          onClick={onClick}
          className={`mt-3 text-sm underline text-${accent}-300 hover:text-${accent}-200`}
        >
          Autofill a good first message
        </button>
      </div>
    </div>
  );
}

function getSenderMeta(sender) {
  switch (sender) {
    case "vendor":
      return { label: "Vendor", badge: "🧑‍🍳", color: "bg-emerald-600" };
    case "host":
      return { label: "Host", badge: "🧑‍💼", color: "bg-amber-600" };
    case "referrer":
      return { label: "Referrer", badge: "🧭", color: "bg-purple-600" };
    default:
      return { label: "AI", badge: "🤖", color: "bg-gray-900" };
  }
}

function formatTime(d) {
  const t = new Date(d);
  return t.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
}
