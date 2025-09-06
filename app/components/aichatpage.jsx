"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./chatbubble";
import LeadQuickCapture from "./leadquickcapture";

type Role = "referrer" | "vendor" | "host";

const seeds: Record<Role, string> = {
  referrer: "Yo! I’m your CAPITALIZE co-pilot. Tell me who you’re connecting (vendor + host) and I’ll draft the intro.",
  vendor: "Welcome to your vendor console. Paste the lead details (event, date, headcount, budget) and I’ll spin up a proposal.",
  host: "Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe) and I’ll help you find vendors."
};

async function callChatAPI(messages: Array<{ role: string; content: string }>, role: Role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("bad status");
  const data = await res.json();
  return data.reply;
}

export default function AIChatPage({ role, header }) {
  const [messages, setMessages] = useState([{ role: "system", content: seeds[role] }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await callChatAPI(newMessages, role);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "_Server error. Try again later._" }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-4 rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-4 text-green-400">{header}</h1>
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-3 bg-gray-800 p-3 rounded">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <ChatBubble role="assistant" content="Typing..." />}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type here... (Cmd/Ctrl+Enter to send)"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold"
        >
          Send
        </button>
      </div>
      <LeadQuickCapture />
    </div>
  );
}
