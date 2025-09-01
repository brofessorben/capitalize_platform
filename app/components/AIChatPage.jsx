"use client";
import { useEffect, useMemo, useRef, useState } from "react";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function warmGreeting(role = "guide") {
  const emojis = ["✨", "🚀", "🧭", "🤝", "🍰", "🎉", "🧠", "⚡️"];
  const hooks = [
    "Welcome to your CAPITALIZE cockpit",
    "Strap in—let’s turn plans into bookings",
    "Your AI operator is online",
    "Let’s ship proposals and stack wins",
  ];
  const promptsCommon = [
    `“Draft a vendor intro for a ${pick(["wedding","corporate","non-profit","birthday","festival"])}.”`,
    `“Is $${pick(["25","40","60","75"])}/pp realistic for ${pick(["80","120","200"])} guests?”`,
    `“Turn this into a proposal with two tiers + upsells.”`,
    `“Summarize this host chat and propose my next reply.”`,
  ];
  const roleTips = {
    referrer: [
      "“Log a referral: host, event date, headcount.”",
      "“Generate a catchy referral blurb.”",
      "“What are my rewards so far?”",
    ],
    vendor: [
      "“Draft a proposal (silver/gold) with upsells.”",
      "“Polish this into an email + SMS follow-up.”",
      "“Suggest a close-now incentive.”",
    ],
    host: [
      "“Compare these quotes and flag tradeoffs.”",
      "“Write a confident-but-kind reply.”",
      "“Make me a day-of timeline.”",
    ],
    guide: [],
  };

  const body =
    `${pick(emojis)} ${pick(hooks)}.\n\n` +
    `Try:\n• ${pick(promptsCommon)}\n• ${pick(promptsCommon)}\n` +
    (roleTips[role]?.length ? `• ${pick(roleTips[role])}\n` : "") +
    `\nDrop raw context and I’ll shape next steps.`;
  return body;
}

export default function AIChatPage({
  title = "AI Copilot",
  sub = "Ask about anything—referrals, proposals, budgets, outreach wording, and more.",
  badge = "Powered by OpenAI",
  role = "guide",
  userId = "demo-user",
}) {
  const scrollerRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // auto greet on mount (fresh each load)
  useEffect(() => {
    setMessages([{ role: "assistant", content: warmGreeting(role) }]);
  }, [role]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: `ui-${userId}-${Date.now()}`,
          sender: role || "guide",
          text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chat error");
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "(no reply)" }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Sorry—something went wrong: ${String(err?.message || err)}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950/80 backdrop-blur">
      {/* Slim stat bar slot could go above here later */}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/70">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-neutral-400">{sub}</div>
        </div>
        <div className="text-[11px] text-neutral-400">{badge}</div>
      </div>

      {/* Thread */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "assistant"
                ? "bg-neutral-900 border border-neutral-800 rounded-xl p-2 text-sm"
                : "bg-emerald-600/20 border border-emerald-700 rounded-xl p-2 text-sm"
            }
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={sendMessage} className="p-3 border-t border-neutral-800 bg-neutral-950">
        <textarea
          rows={3}
          className="w-full resize-none rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          placeholder='Ask a question! e.g., “Draft a 2-tier proposal with upsells for 120 guests at $45/pp.”'
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            disabled={sending || !input.trim()}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold disabled:opacity-50"
          >
            {sending ? "Thinking…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
