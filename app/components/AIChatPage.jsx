"use client";
import { useEffect, useRef, useState } from "react";

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
      "“Log a referral: host name, date, headcount, budget.”",
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

  const base =
    `${pick(emojis)} ${pick(hooks)}.\n\n` +
    `Try:\n• ${pick(promptsCommon)}\n• ${pick(promptsCommon)}\n` +
    (roleTips[role]?.length ? `• ${pick(roleTips[role])}\n` : "");

  const refExtra =
    `\n**Referrers:** include vendor + host details and I’ll handle intros.\n` +
    `• Vendor: name + phone/email\n` +
    `• Host: name + phone/email + event date + headcount + budget (if known)\n` +
    `I’ll draft the intro we settle on and take care of the rest.\n\n` +
    `Need suggestions now? Type: \`/vendors <what> in <city>\` (e.g., \`/vendors taco catering in Austin\`).`;

  return role === "referrer" ? base + refExtra : base + `\nDrop raw context and I’ll shape next steps.`;
}

export default function AIChatPage({
  title = "AI Copilot",
  sub = "Ask about referrals, proposals, budgets, outreach wording, and more.",
  badge = "Powered by OpenAI",
  role = "guide",
  userId = "demo-user",
}) {
  const scrollerRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // auto greet on mount
  useEffect(() => {
    setMessages([{ role: "assistant", content: warmGreeting(role) }]);
  }, [role]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function tryVendorCommand(text) {
    const m = text.match(/^\/vendors\s+(.+)/i);
    if (!m) return false;
    const q = m[1];
    setMessages((msgs) => [...msgs, { role: "assistant", content: `Searching vendors: ${q} …` }]);
    try {
      const res = await fetch(`/api/vendors?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Vendor search failed");
      const lines = (data.results || []).slice(0, 8).map((v, i) => {
        const contact = [v.phone, v.website].filter(Boolean).join(" • ");
        return `${i + 1}. ${v.name}${v.rating ? ` (${v.rating}★)` : ""}\n   ${v.address}${contact ? `\n   ${contact}` : ""}`;
      });
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: lines.length ? lines.join("\n\n") : "No vendors found (try another query/city)." },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: `Sorry—vendor search error: ${String(err?.message || err)}` },
      ]);
    }
    return true;
  }

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending) return;

    if (await tryVendorCommand(text)) {
      setInput("");
      return;
    }

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
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/70">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-neutral-400">{sub}</div>
        </div>
        <div className="text-[11px] text-neutral-400">{badge}</div>
      </div>

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

      <form onSubmit={sendMessage} className="p-3 border-t border-neutral-800 bg-neutral-950">
        <textarea
          rows={3}
          className="w-full resize-none rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          placeholder='Ask a question! e.g., “Draft a 2-tier proposal w/ upsells for 120 guests at $45/pp.”  Tip: /vendors pizza in Denver'
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
