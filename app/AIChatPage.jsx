"use client";
import { useState } from "react";
import ChatBubble from "../components/ChatBubble.tsx";

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Welcome! Ask me anything about your gig." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} role={msg.role} content={msg.content} />
        ))}
      </div>
      <div className="mt-4 flex">
        <input
          type="text"
          className="flex-1 border rounded-l px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
}
