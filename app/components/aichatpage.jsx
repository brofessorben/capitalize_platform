"use client";

import React, { useState, useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

export default function AIChatPage({ role, header }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Load existing messages from Supabase
  useEffect(() => {
    const supabase = getSupabase();

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    loadMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const supabase = getSupabase();
    const { error } = await supabase.from("messages").insert([
      {
        role,
        content: input.trim(),
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
    }

    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white">
      <h2 className="p-4 text-xl font-bold border-b border-gray-700">{header}</h2>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          className="flex-1 p-2 bg-gray-800 rounded text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type it. I’ll make it shine..."
        />
        <button
          className="bg-green-600 px-4 py-2 rounded text-white font-semibold"
          onClick={handleSend}
        >
          Send
        </button>
      </div>

      {role === "referrer" && <LeadQuickCapture />}
    </div>
  );
}
