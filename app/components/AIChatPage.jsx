"use client";
import { useEffect, useMemo, useRef, useState } from "react";

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

  useEffect(() => {
    const query = leadId
      ? `lead_id=${encodeURIComponent(leadId)}`
      : `lead_id=${encodeURIComponent(`${role}:${userId}`)}`;
    fetch(`/api/messages?${query}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, [leadId, role, userId]);

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
    const optimistic = {
      sender: role === "landing" ? "user" : role,
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

  return (
    <div className="min-h-dvh bg-black text-neutral-100 flex flex-col">
      <div className="sticky top-0 z-30 border-b border-neutral-900 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <div
            className="shrink-0 h-10 w-10 rounded-xl grid place-items-center ring-1 ring-neutral-800 bg-neutral-950 shadow-md animate-pulse"
            title="Ask AI (Powered by OpenAI)"
          >
            <div className="relative h-6 w-6">
              <span className="absolute inset-0 rounded-full border border-neutral-500/70" />
              <span className="absolute inset-1 rounded-full border border-neutral-700/70" />
              <span className="absolute inset-2 rounded-full border border-neutral-800/80" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold leading-tight">{title}</div>
            <div className="text-[11px] text-neutral-400">Powered by OpenAI</div>
          </div>
        </div>
        {headerContent && (
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <div className="grid gap-3 sm:grid-cols-3">{headerContent}</div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-4xl w-full px-4 py-4 flex-1">
        <div
          ref={scrollerRef}
          className="h-[66vh] md:h-[70vh] border border-neutral-900 rounded-2xl bg-neutral-950/60 p-4 overflow-y-auto shadow-inner"
        >
          {grouped.map((g, idx) => (
            <div key={idx}>
              <div className="text-[11px] text-neutral-400 mb-1">
                {g.sender} • {g.when.toLocaleTimeString()}
              </div>
              {g.items.map((m, i) => (
                <div key={i} className="px-3 py-2 rounded-2xl bg-neutral-800 mb-2">
                  {m.text}
                </div>
              ))}
            </div>
          ))}
        </div>

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
            className="shrink-0 px-5 h-12 rounded-2xl bg-purple-600 text-white font-medium disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
