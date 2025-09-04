"use client";

import { useState } from "react";
import ChatBubble from "./ChatBubble";

/**
 * FINAL chat page component used by all three dashboards.
 * Renders proper paragraphs, headings, and bullets via ChatBubble.
 */
export default function AIChatPage({ header = "Console" }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "### Welcome\n\nAsk me anything about your active or pending gig.\n\n- I can format with **headings**\n- I can make *bulleted lists*\n- And clean paragraphs",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    if (!input.trim() || busy) return;

    const userMsg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    try {
      // If you have an API, call it here. For now, echo with nice formatting.
      const fakeReply = [
        "### Got it",
        "",
        "Here’s how I’ll proceed:",
        "- Capture the details",
        "- Draft an intro",
        "- Keep the momentum",
        "",
        "**Next step:** paste a short description and I’ll turn it into a message.",
      ].join("\n");
      setMessages((m) => [...m, { role: "ai", content: fakeReply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", content: "### Error\n\nCouldn’t reach the AI service." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-gray-900">{header}</div>

      <div className="space-y-3 mb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 bg-white text-gray-900"
          placeholder="Type your message… (headings & bullets supported)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={busy}
        />
        <button
          onClick={handleSend}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
