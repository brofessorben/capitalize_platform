"use client";
import { useState } from "react";
import { MessageCircle } from "lucide-react"; // fallback icon

export default function HelpAI({ role, userId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userId, text: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Error connecting to AI." }]);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white"
      >
        {/* ChatGPT swirl logo style */}
        <span className="text-lg">🟢⚪🌀</span>
        <span className="text-xs font-medium">Powered by OpenAI</span>
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur shadow-xl flex flex-col overflow-hidden z-50">
          <div className="p-3 border-b border-neutral-800 text-sm font-semibold">
            AI Helper
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
            {messages.length === 0 && (
              <div className="text-neutral-500 text-center">
                Ask me anything about CAPITALIZE!
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-xl ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white self-end ml-10"
                    : "bg-neutral-800 text-neutral-200 self-start mr-10"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="p-2 border-t border-neutral-800 flex gap-2">
            <input
              className="flex-1 rounded-xl bg-neutral-900 text-neutral-200 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask a question! (e.g. "How do referrals work?", "How do vendors get paid?")'
            />
            <button
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
              type="submit"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
