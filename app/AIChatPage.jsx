"use client";
import React, { useState } from "react";
import ChatBubble from "./components/ChatBubble";

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await res.json();
      const aiMessage = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[80vh] bg-white rounded-xl shadow-md p-4">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
      </div>

      <textarea
        className="w-full border rounded-lg p-2 resize-none focus:outline-none focus:ring focus:ring-blue-400"
        rows={2}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Shift+Enter to send)"
      />

      <button
        onClick={handleSend}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  );
}
