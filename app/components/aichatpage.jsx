"use client";
import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

export default function AIChatPage({ role, header }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

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

    const ch = supabase
      .channel("realtime-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => setMessages((m) => [...m, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const supabase = getSupabase();
    await supabase.from("messages").insert({ role, content: text });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white">
      <h2 className="p-4 text-xl font-bold border-b border-gray-700">{header}</h2>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          className="flex-1 p-2 bg-gray-800 rounded text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type it. I’ll make it shine..."
        />
        <button className="bg-green-600 px-4 py-2 rounded font-semibold" onClick={send}>
          Send
        </button>
      </div>

      {role === "referrer" && <LeadQuickCapture />}
    </div>
  );
}
