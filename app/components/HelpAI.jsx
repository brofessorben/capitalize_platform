"use client";
import { useEffect, useRef, useState } from "react";

export default function HelpAI({ role = "guest", userId = "dev-ben" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState([
    { role: "assistant", text: "Hey! Ask me anything about Capitalize—or your role." }
  ]);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    setThread(t => [...t, { role: "user", text }]);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userId, question: text })
      });
      const data = await res.json();
      setThread(t => [...t, { role: "assistant", text: data.reply || "…" }]);
    } catch {
      setThread(t => [...t, { role: "assistant", text: "Sorry—something went wrong." }]);
    } finally {
      setSending(false);
    }
  }
  function onKey(e){ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); } }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-white/10 border border-white/20 backdrop-blur text-white text-xl"
        title="Help"
      >
        ?
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[22rem] max-h-[70vh] rounded-2xl border border-white/15 bg-black/70 backdrop-blur text-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-sm">
            Capitalize Assistant <span className="opacity-60">({role})</span>
          </div>
          <div className="p-3 space-y-2 overflow-auto">
            {thread.map((m,i)=>(
              <div key={i} className={m.role==="assistant" ? "text-sm" : "text-sm text-purple-200 text-right"}>
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-white/10">
            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything… (Enter to send)"
              className="w-full rounded-xl bg-white/5 border border-white/10 p-2 text-sm min-h-[44px] focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
