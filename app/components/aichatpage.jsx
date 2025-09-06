"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";
import SuggestedPrompts from "./suggestedprompts"; // <-- NEW

export default function AIChatPage({ role, header }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const supabase = getSupabase();

    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error) setMessages(data || []);
    };
    load();

    const channel = supabase
      .channel("realtime-messages")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body) return;
    const supabase = getSupabase();
    await supabase.from("messages").insert([{ role, content: body }]);
    if (text === undefined) setInput("");
  };

  // Chips behavior: insert or send
  const handlePick = async (text) => {
    const insertOnly = true; // set false to auto-send on tap
    if (insertOnly) {
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    } else {
      await send(text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b0b] text-white">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold">{header}</h2>
        <SuggestedPrompts role={role} onPick={handlePick} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type it. I’ll make it shine..."
          className="flex-1 p-2 bg-gray-900 rounded text-white outline-none focus:ring-2 focus:ring-[#1f8f5a]"
        />
        <button
          onClick={() => send()}
          className="bg-[#1f8f5a] hover:bg-[#1a784c] px-4 py-2 rounded font-semibold"
        >
          Send
        </button>
      </div>

      {role === "referrer" && <LeadQuickCapture />}
    </div>
  );
}
