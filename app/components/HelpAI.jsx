"use client";
import { useEffect, useRef, useState } from "react";

/** Small ChatGPT-ish logo */
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

export default function HelpAI({
  userId = "demo-user",
  role = "guide",
  placeholder = "Ask a question! e.g., “How do referrals work?”, “Draft a vendor intro”, “What’s next for a new host?”",
}) {
  // open/close
  const [open, setOpen] = useState(false);

  // draggable position
  const [pos, setPos] = useState({ top: 100, left: typeof window !== "undefined" ? window.innerWidth / 2 - 180 : 120 });
  const dragRef = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const x = e.clientX - offset.current.x;
      const y = e.clientY - offset.current.y;
      setPos((p) => ({
        top: Math.max(8, Math.min(window.innerHeight - 80, y)),
        left: Math.max(8, Math.min(window.innerWidth - 320, x)),
      }));
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
    if (!dragRef.current) return;
    dragging.current = true;
    const rect = dragRef.current.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // chat state
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I’m your CAPITALIZE guide. Ask me anything or tell me what you’re trying to do." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);

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

  // Closed state: show only the pulsing button (at pos)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 50 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-black font-semibold shadow-lg animate-pulse"
        title="Ask AI (Powered by OpenAI)"
      >
        <GPTMark className="w-4 h-4" />
        Ask AI
      </button>
    );
  }

  // Open: chat box appears exactly where button was; header is draggable and contains the same button look
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
      <div className="max-h-[50vh] overflow-y-auto p-3 space-y-2">
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
