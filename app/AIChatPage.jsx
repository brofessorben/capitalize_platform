// app/AIChatPage.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./components/ChatBubble";

export default function AIChatPage({ role = "referrer", header = "" }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        header ||
        `Referrer Console
Share who you’re connecting and context. I’ll draft a clean intro **or** a full proposal when you paste event info.
• **Vendor**: name + contact
• **Host**: name + phone/email
• **Context**: date, headcount, budget, notes`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef(null);
  const scrollerRef = useRef(null);

  // Auto-grow textarea height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(180, ta.scrollHeight) + "px";
  }, [input]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);

    const next = [...messages, { role: "user", text }];
    setMessages(next);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, role }),
      });
      const data = await resp.json();
      const reply = data?.text || "Hmm, I couldn’t generate a reply.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Server error. Try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    // Enter = newline; Ctrl/Cmd+Enter = send
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="text-sm text-neutral-400 mb-3">Powered by OpenAI · CAP</div>

      <div
        ref={scrollerRef}
        className="w-full rounded-2xl bg-neutral-900 border border-neutral-800 p-4"
        style={{ height: "56vh", overflowY: "auto" }}
      >
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
      </div>

      <div className="mt-3 flex gap-2 items-start">
        <textarea
          ref={textareaRef}
          className="flex-1 rounded-xl bg-neutral-900 text-neutral-100 border border-neutral-700 px-3 py-2 resize-none outline-none"
          placeholder="Type your message… (headings & bullets supported). Enter = newline, Ctrl/Cmd+Enter = Send"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          onClick={send}
          disabled={busy}
          className={`px-4 py-2 rounded-xl ${
            busy ? "bg-neutral-700" : "bg-emerald-600 hover:bg-emerald-500"
          } text-white font-medium`}
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
