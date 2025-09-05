"use client";
import { useState } from "react";

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newMsg] }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "_Server ghosted us 👻. Try again in a sec._",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-zinc-800 p-4 shadow-md">
        <h1 className="text-xl font-bold tracking-wide">
          CAPITALIZE Referrer Console 🚀
        </h1>
        <p className="text-sm text-zinc-400">
          Drop vendor + host details, or just ask away.
        </p>
      </header>

      {/* Chat window */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-line leading-relaxed ${
              m.role === "user"
                ? "bg-green-600 text-white ml-auto"
                : "bg-zinc-700 text-zinc-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="bg-zinc-700 text-zinc-300 rounded-2xl px-4 py-2 w-fit animate-pulse">
            Thinking…
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="p-4 bg-zinc-800 border-t border-zinc-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 bg-zinc-900 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-zinc-500"
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
