"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "../../../components/BackButton";

const ROLE_OPTIONS = [
  { id: "vendor", label: "Vendor", badge: "🧑‍🍳", color: "bg-blue-600" },
  { id: "host", label: "Host", badge: "🧑‍💼", color: "bg-amber-600" },
  { id: "referrer", label: "Referrer", badge: "🧭", color: "bg-emerald-600" },
];

export default function ChatPage({ params }) {
  const { lead_id } = params;
  const [messages, setMessages] = useState([]);
  const [sender, setSender] = useState("vendor");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    fetch(`/api/messages?lead_id=${lead_id}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, [lead_id]);

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

    const optimistic = { sender, text, role: "user", created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id, sender, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chat error");
      setMessages((m) => [
        ...m,
        { sender: "ai", role: "assistant", text: data.reply, created_at: new Date().toISOString() },
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

  return (
    <div className="min-h-dvh bg-white">
      <div className="border-b sticky top-0 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black text-white grid place-items-center font-bold">AI</div>
            <div>
              <div className="font-semibold leading-tight">Negotiation Chat</div>
              <div className="text-xs text-gray-500">Lead: {lead_id}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSender(r.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${
                  sender === r.id ? `${r.color} text-white border-transparent` : "border-gray-300 hover:bg-gray-50"
                }`}
                title={r.label}
              >
                <span className="mr-1">{r.badge}</span>{r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4">
        <div ref={scrollerRef} className="h-[70vh] border rounded-2xl bg-gray-50 p-4 overflow-y-auto shadow-inner">
          {grouped.length === 0 && (
            <EmptyState onClick={() => setInput("We can do $30/pp for 120 guests. Any dietary restrictions?")} />
          )}
          <div className="space-y-4">
            {grouped.map((g, idx) => (
              <MessageGroup key={idx} sender={g.sender} when={g.when} items={g.items} />
            ))}
          </div>
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex items-end gap-2">
          <textarea
            className="flex-1 border rounded-2xl p-3 min-h-[48px] max-h-40 resize-y focus:outline-none focus:ring-2 focus:ring-black/10"
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            disabled={sending || input.trim() === ""}
            className="shrink-0 px-5 h-12 rounded-2xl bg-black text-white font-medium disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500">
          Pro tip: switch roles (Vendor/Host/Referrer) to speak as that party. AI replies with next best step.
        </div>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */
function MessageGroup({ sender, when, items }) {
  const meta = getSenderMeta(sender);
  const align = sender === "ai" ? "items-start" : "items-end";
  const bubbleBase = "px-3 py-2 rounded-2xl shadow-sm border text-sm whitespace-pre-wrap break-words max-w-[75%]";
  return (
    <div className={`flex ${align} gap-3`}>
      {sender === "ai" ? <Avatar meta={meta} /> : <div className="w-8" />}
      <div className="flex flex-col gap-1">
        <div className="text-[11px] text-gray-500">{meta.label} • {formatTime(when)}</div>
        {items.map((m, i) => (
          <div
            key={i}
            className={`${bubbleBase} ${
              sender === "ai" ? "bg-white border-gray-200"
                : sender === "vendor" ? "bg-blue-600 text-white border-blue-700"
                : sender === "host" ? "bg-amber-600 text-white border-amber-700"
                : "bg-emerald-600 text-white border-emerald-700"
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
    <div className={`w-8 h-8 rounded-xl grid place-items-center ${meta.color} text-white`}>
      <span className="text-base" title={meta.label}>{meta.badge}</span>
    </div>
  );
}

function EmptyState({ onClick }) {
  return (
    <div className="h-full grid place-items-center">
      <div className="text-center">
        <div className="text-6xl">💬</div>
        <div className="mt-2 font-semibold">Start the conversation</div>
        <div className="text-sm text-gray-600">Ask for date, headcount, budget, add-ons, rain plan, etc.</div>
        <button onClick={onClick} className="mt-3 text-sm underline">Autofill a good first message</button>
      </div>
    </div>
  );
}

function getSenderMeta(sender) {
  switch (sender) {
    case "vendor": return { label: "Vendor", badge: "🧑‍🍳", color: "bg-blue-600" };
    case "host": return { label: "Host", badge: "🧑‍💼", color: "bg-amber-600" };
    case "referrer": return { label: "Referrer", badge: "🧭", color: "bg-emerald-600" };
    default: return { label: "AI", badge: "🤖", color: "bg-gray-900" };
  }
}
function formatTime(d) {
  const t = new Date(d);
  return t.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
}
