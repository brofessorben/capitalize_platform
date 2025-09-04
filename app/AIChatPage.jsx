"use client";

import { useState } from "react";
import ChatBubble from "@/components/ChatBubble";

const ENDPOINT = "/api/chat"; // change only if your API route is different

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Yo! I’m your CAPITALIZE co-pilot. Ask me anything." },
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
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();

      // Accept whatever your API returns: reply | text | message | content
      const reply =
        data.reply ??
        data.text ??
        data.message ??
        data.content ??
        "### Summary\n\nI responded, but the API didn’t send text.";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "### Error\n\nCould not reach the AI endpoint." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Referrer Console</h1>

      <div className="space-y-2">
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role === "assistant" ? "ai" : "user"}
            content={m.content}
          />
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 bg-black/5"
          placeholder="Ask anything — e.g., 'Summarize with headings and bullets.'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
