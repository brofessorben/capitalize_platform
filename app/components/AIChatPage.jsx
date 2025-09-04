"use client";

import { useState } from "react";
import ChatBubble from "./ChatBubble";

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Welcome to CAPITALIZE! Ask me anything." }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = { sender: "user", text: input };
    setMessages([...messages, newMessage, { sender: "ai", text: "Thinking..." }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <ChatBubble key={i} sender={msg.sender} text={msg.text} />
        ))}
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-l px-3 py-2"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
}
