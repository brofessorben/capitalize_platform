"use client";
import { useEffect, useRef, useState } from "react";

export default function HelpAI({ role = "generic", userId = "anon" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "sys-hello",
      sender: "ai",
      text:
        "Hey! I’m your CAPITALIZE assistant. Ask me about Referrers, Vendors, Hosts, payouts, proposals, or anything else. I can also help with general event questions.",
      created_at: new Date().toISOString(),
    },
  ]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");

    const optimistic = { id: crypto.randomUUID(), sender: "user", text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: `${role}-${userId}`,
          sender: "user",
          text: decoratePrompt(text, role),
        }),
      });
      const data = await res.json();
      const reply =
        (data && (data.reply || data.message)) ||
        "I’m having trouble reaching the model right now. Try again in a moment.";
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), sender: "ai", text: reply, created_at: new Date().toISOString() },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "⚠️ Oops, something went wrong. Try again soon.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        aria-label="Open AI helper"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[1000] flex flex-col items-center justify-center w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl animate-pulse-glow relative"
      >
        <ChatGPTSwirl className="w-10 h-10" />
        <span className="text-[10px] font-semibold mt-1">Ask AI</span>
        {/* pulsing ring */}
        <span className="absolute inset-0 rounded-full border-4 border-emerald-400 opacity-50 animate-ping"></span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[1001] flex items-end sm:items-center sm:justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative m-3 sm:mr-5 sm:mb-5 w-full sm:w-[420px] rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-800 grid place-items-center">
                  <ChatGPTSwirl className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <div className="font-semibold">Assistant</div>
                  <div className="text-xs text-neutral-400">Powered by OpenAI</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollerRef} className="max-h-[55vh] overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "ai" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl border px-3 py-2 text-sm ${
                      m.sender === "ai"
                        ? "bg-neutral-900 border-neutral-800"
                        : "bg-emerald-600 text-white border-emerald-700"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <form onSubmit={sendMessage} className="p-3 border-t border-neutral-800">
              <div className="flex items-end gap-2">
                <textarea
                  className="flex-1 resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600/30"
                  rows={2}
                  placeholder={`Ask a question! (e.g. "How do referrals work?", "How do vendors get paid?", "What should a proposal include?")`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  disabled={busy || input.trim() === ""}
                  className="shrink-0 h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-50"
                >
                  {busy ? "…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* extra animation style */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.6);
          }
          50% {
            box-shadow: 0 0 25px rgba(16, 185, 129, 1), 0 0 50px rgba(16, 185, 129, 0.8);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </>
  );
}

/* ---------- helpers ---------- */

function decoratePrompt(text, role) {
  const preface = `You are the CAPITALIZE in-app assistant. Be concise, helpful, and specific. 
If the user asks about the product, cover capabilities for Referrers, Vendors, and Hosts. 
If they ask general event/vendor questions, give pragmatic steps.`;
  return `${preface}\n\nUser (role=${role}): ${text}`;
}

function ChatGPTSwirl({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5a5.5 5.5 0 014.9 3l.4.8a4.8 4.8 0 013.8 4.7 4.8 4.8 0 01-1.9 3.8l-.7.5a5.5 5.5 0 01-4.9 6.2 5.5 5.5 0 01-4.9-3l-.4-.8a4.8 4.8 0 01-3.8-4.7c0-1.5.7-2.8 1.9-3.8l.7-.5A5.5 5.5 0 0112 2.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.3"
      />
      <path
        d="M12 6.5c2.4 0 3.5 1.9 3.9 2.7.2.3.6.5 1 .5 1.5 0 2.6 1.1 2.6 2.6 0 .9-.5 1.7-1.2 2.2-.3.2-.5.6-.4 1 0 0 .1.4.1.6a3.9 3.9 0 01-3.9 3.9c-2.4 0-3.5-1.9-3.9-2.7a1.2 1.2 0 00-1-.5 2.6 2.6 0 01-2.6-2.6c0-.9.5-1.7 1.2-2.2.3-.2.5-.6.4-1 0 0-.1-.4-.1-.6A3.9 3.9 0 0112 6.5z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}
