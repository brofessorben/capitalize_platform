"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import { ensureThread, fetchMessages, addMessage } from "@/lib/chatStore";

// fun seeds per role
const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop who you’re connecting (vendor + host + context). I’ll draft a clean intro and keep momentum rolling.",
  vendor:
    "Vendor console loaded. Paste lead details (event, date, headcount, budget, location, notes) and I’ll craft a slick reply/proposal.",
  host:
    "Welcome! Tell me about your event (date, headcount, budget, vibe, constraints). I’ll draft a tight vendor request/proposal.",
};

export default function AIChatPage({
  role = "referrer",
  header = "Console",
  eventId,               // <- pass me to bind this chat to that event
}) {
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([
    { sender: "assistant", content: seeds[role] || seeds.referrer },
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");

  const taRef = useRef(null);

  // grow textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [input]);

  // stable thread key per browser
  const threadKey = useMemo(() => {
    const k = `cap_thread_key_${role}`;
    let v = localStorage.getItem(k);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(k, v);
    }
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // when eventId changes, ensure thread + load history
  useEffect(() => {
    if (!eventId) return; // nothing selected yet
    (async () => {
      const t = await ensureThread(eventId, role, threadKey);
      setThread(t);
      const hist = await fetchMessages(t.id);
      if (hist.length) {
        setMessages(hist.map(m => ({ sender: m.sender, content: m.content })));
      } else {
        // seed again for a fresh thread
        setMessages([{ sender: "assistant", content: seeds[role] || seeds.referrer }]);
      }
    })();
  }, [eventId, role, threadKey]);

  async function send() {
    const text = input.trim();
    if (!text || busy || !thread) return;
    setInput("");
    setBusy(true);

    // push user + persist
    setMessages(m => [...m, { sender: "user", content: text }]);
    await addMessage(thread.id, "user", text);

    try {
      // ask our /api/chat with all prior context
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          messages: [
            ...messages.map(m => ({
              role: m.sender === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
            { role: "user", content: text },
          ],
        }),
      });
      const data = await res.json();
      const reply = data.reply || "I’m here—share details and I’ll draft the next move.";
      setMessages(m => [...m, { sender: "assistant", content: reply }]);
      await addMessage(thread.id, "assistant", reply);
    } catch {
      const fallback = "_Couldn’t reach the server. Try again soon._";
      setMessages(m => [...m, { sender: "assistant", content: fallback }]);
      await addMessage(thread.id, "assistant", fallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-white">{header}</div>

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.sender === "user" ? "user" : "ai"} content={m.content} />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
        {!eventId && (
          <ChatBubble
            role="ai"
            content="Pick an event below to load its chat thread (or create a new event)."
          />
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          disabled={!eventId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds newline; Cmd/Ctrl+Enter sends
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          })}
          placeholder={eventId ? "Type your message… (Cmd/Ctrl+Enter to send)" : "Select an event…"}
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-xl bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 px-3 py-2 disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={busy || !eventId}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
          aria-label="Send"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
