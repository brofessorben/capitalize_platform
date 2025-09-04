"use client";

import { useState } from "react";
import ChatBubble from "@/components/ChatBubble"; // uses /components/ChatBubble.tsx

export default function AIChatPage({ role = "referrer", header = "Console" }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `### ${header}\n\nI’m ready. Tell me what you need.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!input.trim() || busy) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.text ?? data.message ?? data.content ?? "No response.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "### Error\n\nCouldn’t reach API." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-4">
      <div className="text-2xl font-semibold">{header}</div>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "assistant" ? "ai" : "user"} content={m.content} />
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 bg-black/5"
          placeholder="Ask me anything — headings & bullets supported."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <button className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50" onClick={send} disabled={busy}>
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
