"use client";
import { useState } from "react";
import ChatBubble from "./ChatBubble";

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hey! Got a question about an active or pending gig? Ask me anything." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");

    // Mock AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Good question. Let me look into that for you..." },
      ]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-white shadow rounded-2xl p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          className="bg-blue-500 text-white rounded-xl px-4 py-2 text-sm hover:bg-blue-600"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
