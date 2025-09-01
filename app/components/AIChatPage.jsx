"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function AIChatPage({
  role,               // "referrer" | "vendor" | "host"
  userId = "dev-ben", // who is chatting
  title = "Dashboard",
  kpis = [],          // [{label, value}] small top-row KPIs
  quickPrompts = [],  // optional suggested prompts
}) {
  const [messages, setMessages] = useState([
    {
      id: "sys-welcome",
      sender: "ai",
      text:
        role === "referrer"
          ? "Welcome! Drop your lead details here: host name, contact, event type, headcount, date window, budget, and any constraints. I’ll draft outreach and track it."
          : role === "vendor"
          ? "Welcome! Ask me to draft a proposal, tune pricing, or handle a negotiation. Paste a brief and I’ll help you shape it fast."
          : "Welcome! Tell me what you’re planning—date, headcount, budget, and preferences. I’ll help you create a request and compare proposals.",
      created_at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
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
    if (!text || busy) return;
    setBusy(true);
    setInput("");

    const optimistic = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: `${role}-${userId}`,
          sender: role,
          text: decoratePrompt(text, role),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chat error");
      const reply = data.reply || data.message || "OK.";
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "⚠️ I hit an issue talking to the model. Try again in a few.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-black text-neutral-100">
      {/* Top bar with title + small KPIs */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur border-b border-neutral-900">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 grid place-items-center">🤖</div>
            <div>
              <div className="text-sm text-neutral-400 capitalize">{role}</div>
              <div className="font-semibold leading-tight">{title}</div>
            </div>
          </div>
          {kpis?.length > 0 && (
            <div className="hidden md:flex gap-3">
              {kpis.map((k, i) => (
                <div key={i} className="rounded-xl border border-neutral-900 bg-neutral-950/60 px-3 py-2">
                  <div className="text-[11px] text-neutral-400">{k.label}</div>
                  <div className="text-lg font-semibold">{k.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Full-page chat */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {quickPrompts?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs rounded-full border border-neutral-800 bg-neutral-950/50 px-3 py-1 hover:bg-neutral-900"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div
          ref={scrollerRef}
          className="h-[70vh] border border-neutral-900 rounded-2xl bg-neutral-950/60 p-4 overflow-y-auto shadow-inner"
        >
          {grouped.length === 0 && <EmptyState role={role} onClick={() => setInput(exampleText(role))} />}
          <div className="space-y-4">
            {grouped.map((g, idx) => (
              <MessageGroup key={idx} sender={g.sender} when={g.when} items={g.items} />
            ))}
          </div>
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex items-end gap-2">
          <textarea
            className="flex-1 border border-neutral-900 rounded-2xl bg-neutral-950/70 px-3 py-3 min-h-[48px] max-h-40 resize-y outline-none focus:ring-2 focus:ring-emerald-600/30"
            placeholder={`Ask a question or paste details… (Enter to send, Shift+Enter = newline)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                sendMessage(e);
              }
            }}
          />
          <button
            disabled={busy || input.trim() === ""}
            className="shrink-0 px-5 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
          >
            {busy ? "…" : "Send"}
          </button>
        </form>

        <div className="mt-2 text-xs text-neutral-400">
          Pro tip: Put all the info here—this chat is your command center.
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers/partials ---------- */

function decoratePrompt(text, role) {
  const preface = `You are the CAPITALIZE in-app assistant. Be specific, fast, and helpful. 
- If role=referrer: help gather host/contact, event type, headcount, budget, date range, constraints; draft outreach; track lead.
- If role=vendor: help craft pricing, proposal, scope & terms; simulate negotiation replies.
- If role=host: help create a clear request, compare proposals, and next steps to book. 
Be pragmatic.`;
  return `${preface}\n\nUser (role=${role}): ${text}`;
}

function exampleText(role) {
  if (role === "referrer") {
    return "Lead: Host=Sarah Chen, Email=sarah@example.com, Event=Offsite dinner, Headcount=45, Window=Oct 3-5 evenings, Budget=$35/pp, Needs=vegan options.";
  }
  if (role === "vendor") {
    return "Draft a catering proposal for 120 guests, buffet, $28–$32/pp, 2 staff, drop-off OK, upsell dessert for +$4/pp.";
  }
  return "I’m planning a team offsite lunch for ~30 next Friday. Budget $20–$25/pp, vegetarian-friendly. What info do vendors need?";
}

function MessageGroup({ sender, when, items }) {
  const align = sender === "ai" ? "items-start" : "items-end";
  const bubble =
    sender === "ai"
      ? "bg-neutral-900 border-neutral-800"
      : "bg-emerald-600 text-white border-emerald-700";

  return (
    <div className={`flex ${align} gap-3`}>
      {sender === "ai" ? <Avatar label="AI" /> : <div className="w-8" />}
      <div className="flex flex-col gap-1">
        <div className="text-[11px] text-neutral-500">
          {sender.toUpperCase()} • {formatTime(when)}
        </div>
        {items.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-2xl shadow-sm border text-sm whitespace-pre-wrap break-words max-w-[75%] ${bubble}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      {sender !== "ai" ? <Avatar label="You" /> : <div className="w-8" />}
    </div>
  );
}

function Avatar({ label }) {
  return (
    <div className="w-8 h-8 rounded-xl grid place-items-center bg-emerald-700 text-white text-xs font-semibold">
      {label === "AI" ? "🤖" : "🙂"}
    </div>
  );
}

function EmptyState({ role, onClick }) {
  return (
    <div className="h-full grid place-items-center">
      <div className="text-center">
        <div className="text-6xl">💬</div>
        <div className="mt-2 font-semibold">Start the conversation</div>
        <div className="text-sm text-neutral-400">
          {role === "referrer"
            ? "Paste host + event details. I’ll draft outreach and track it."
            : role === "vendor"
            ? "Paste the brief. I’ll draft a proposal and help negotiate."
            : "Describe your event and constraints. I’ll help you request & compare."}
        </div>
        <button onClick={onClick} className="mt-3 text-sm underline">
          Autofill an example
        </button>
      </div>
    </div>
  );
}

function formatTime(d) {
  const t = new Date(d);
  return t.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
}
