"use client";
import { useEffect, useRef, useState } from "react";

/** Tiny ChatGPT-ish mark */
function GPTMark({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <path
        d="M127.8 15c-22.6 0-43.6 8.8-59.6 24.8C52.2 55.8 43.4 76.8 43.4 99.4c0 5.3.6 10.6 1.7 15.6C25.3 127.7 12 147.4 12 169.7 12 207 42.7 237.7 80 237.7h13.1c7.8 0 14.1-6.3 14.1-14.1v-18.1c6.9 3.3 14.6 5.1 22.6 5.1 8 0 15.7-1.8 22.6-5.1v18.1c0 7.8 6.3 14.1 14.1 14.1H190c37.3 0 68-30.7 68-68 0-22.3-13.3-42-33.1-54.7 1.1-5 1.7-10.3 1.7-15.6 0-22.6-8.8-43.6-24.8-59.6C171.8 23.8 150.8 15 128.2 15h-.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function warmGreeting(role = "guide") {
  const emojis = ["✨", "🚀", "🧭", "🤝", "🍰", "🎉", "🧠", "⚡️"];
  const hooks = [
    "I'm your on-call deal co-pilot",
    "Think of me as your tiny ops team in a box",
    "Let's turn chaos into booked gigs",
    "I'm the glue between hosts, vendors, and wins",
    "Ideas to invoice—faster",
    "Your AI concierge for CAPITALIZE",
  ];
  const promptsCommon = [
    `“Draft an intro DM to a ${pick(["wedding","corporate","non-profit","birthday","festival"])} host.”`,
    `“Gut-check this budget: ${pick(["120 ppl", "75 ppl", "200 ppl"])}, ${pick(["$25","$45","$60"])}/pp.”`,
    `“Turn this into a proposal with upsells: taco bar + mocktails.”`,
    `“Summarize this long message and suggest my reply.”`,
    `“Create a referral link blurb and CTA.”`,
  ];

  const roleTips = {
    referrer: [
      "“Log a referral: host name, date, headcount, budget.”",
      "“Write a sharable ‘why this vendor’ blurb.”",
      "“What’s my rewards status?”",
    ],
    vendor: [
      "“Draft a proposal with two tiers and upsells.”",
      "“Turn this lead into an email + SMS follow-up.”",
      "“Suggest a ‘book-now’ incentive.”",
    ],
    host: [
      "“Compare two vendor quotes and call out tradeoffs.”",
      "“Make me a day-of timeline.”",
      "“Rewrite my message confident but friendly.”",
    ],
    guide: [],
  };

  const base =
    `Hey! ${pick(emojis)} ${pick(hooks)}.\n\n` +
    `Try me with:\n• ${pick(promptsCommon)}\n• ${pick(promptsCommon)}\n` +
    (roleTips[role]?.length ? `• ${pick(roleTips[role])}\n` : "");

  const refExtra =
    `\n**Referrers:** drop the vendor + host details and I’ll handle intros.\n` +
    `• Vendor: name + phone/email\n` +
    `• Host: name + phone/email + event date + headcount + budget (if known)\n` +
    `I’ll draft the intro we settle on and take care of the rest from there.\n\n` +
    `Want local options now? Type: \`/vendors <what> in <city>\`\n` +
    `e.g., \`/vendors taco catering in Austin\``;

  return role === "referrer" ? base + refExtra : base + `\nOr just drop context and I’ll tee up next steps.`;
}

export default function HelpAI({
  userId = "demo-user",
  role = "guide",
  placeholder = "Ask anything. Example: “Draft a proposal with upsells for 120 guests at $40/pp.”",
}) {
  const [open, setOpen] = useState(false);

  // draggable
  const [pos, setPos] = useState({
    top: 100,
    left: typeof window !== "undefined" ? window.innerWidth / 2 - 180 : 120,
  });
  const dragRef = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const x = e.clientX - offset.current.x;
      const y = e.clientY - offset.current.y;
      setPos({
        top: Math.max(8, Math.min(window.innerHeight - 80, y)),
        left: Math.max(8, Math.min(window.innerWidth - 340, x)),
      });
    };
    const onUp = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onDragStart = (e) => {
    dragging.current = true;
    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Open + auto-greet
  const openChat = () => {
    setOpen(true);
    const greeting = warmGreeting(role);
    setMessages((m) => [...m, { role: "assistant", content: greeting }]);
  };

  // simple slash command: /vendors <what> in <city>
  async function tryVendorCommand(text) {
    const m = text.match(/^\/vendors\s+(.+)/i);
    if (!m) return false;
    const q = m[1]; // free-form
    setMessages((msgs) => [...msgs, { role: "assistant", content: `Searching vendors: ${q} …` }]);
    try {
      const res = await fetch(`/api/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Vendor search failed");
      const lines = (data.items || []).slice(0, 6).map((v, i) => {
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

    // Intercept /vendors command
    if (await tryVendorCommand(text)) {
      setInput("");
      return;
    }

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
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

  if (!open) {
    return (
      <button
        onClick={openChat}
        style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 50 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black font-semibold shadow-lg animate-pulse"
        title="Ask AI (Powered by OpenAI)"
      >
        <GPTMark className="w-4 h-4" />
        Ask AI
      </button>
    );
  }

  return (
    <div
      ref={dragRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: 340, zIndex: 50 }}
      className="rounded-2xl shadow-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur overflow-hidden"
    >
      {/* Header / drag handle */}
      <div
        onMouseDown={onDragStart}
        className="cursor-grab active:cursor-grabbing select-none flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500 text-black font-semibold">
            <GPTMark className="w-4 h-4" />
            Ask AI
          </span>
          <span className="text-[11px] text-neutral-400">Powered by OpenAI</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-neutral-400 hover:text-white px-2 py-1 rounded"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="max-h[50vh] max-h-[50vh] overflow-y-auto p-3 space-y-2">
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
          rows={2}
          className="w-full resize-none rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
          <div>Tip: try <code>/vendors pizza in Denver</code></div>
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
