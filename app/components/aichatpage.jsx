// app/components/aichatpage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";
import SuggestedPrompts from "./suggestedprompts";

export default function AIChatPage({ role = "referrer", header = "" }) {
  const supabase = getSupabase();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  // Load + realtime
  useEffect(() => {
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        setMessages((prev) => [...prev, p.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [supabase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Quick relevance picks from last user message
  const lastUser = useMemo(
    () => [...messages].reverse().find((m) => m.role !== "assistant")?.content || "",
    [messages]
  );

  const smartSuggestions = useMemo(() => {
    const seeds = {
      referrer: [
        "Draft the intro between vendor + host",
        "Summarize & list next steps",
        "Turn this into a text I can send",
        "Write a tight follow-up",
        "Suggest 3 vendors to ping",
      ],
      vendor: [
        "Turn details into a clean proposal",
        "Ask 5 clarifying questions",
        "Generate good/better/best packages",
        "Draft a short pitch email",
        "Create a task checklist",
      ],
      host: [
        "Turn plan into a vendor request",
        "Suggest 3 matched vendors",
        "Make a day-of timeline",
        "Write a polite availability check",
        "List hidden costs to watch",
      ],
    }[role] || [];

    if (!lastUser) return seeds;

    const l = lastUser.toLowerCase();
    const add = [];
    if (l.includes("bbq") || l.includes("menu")) add.push("Find 3 BBQ vendors with menus");
    if (l.includes("budget")) add.push("Give 3 options at different budgets");
    if (l.includes("wedding")) add.push("Draft wedding-appropriate outreach");
    if (l.includes("follow")) add.push("Write a crisp follow-up now");
    if (l.includes("truck")) add.push("List availability questions for food trucks");

    // de-dupe, keep first 6
    const seen = new Set();
    return [...add, ...seeds].filter((s) => (seen.has(s) ? false : seen.add(s))).slice(0, 6);
  }, [lastUser, role]);

  const send = async (text) => {
    if (!text?.trim() || sending) return;
    setSending(true);
    try {
      // hit our API (this will also save user + assistant messages)
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content: text.trim() }),
      });
      setInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => send(input);
  const handlePick = (t) => send(t);

  return (
    <div className="flex flex-col min-h-[80vh] bg-[#0b0b0b] text-white">
      <h2 className="p-4 text-xl font-bold border-b border-gray-800">{header}</h2>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {/* Suggestions UNDER the latest message */}
        <SuggestedPrompts role={role} onPick={handlePick} items={smartSuggestions} compact />

        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-gray-800 flex gap-2 sticky bottom-0 bg-[#0b0b0b]">
        <input
          className="flex-1 p-2 bg-[#0f1220] rounded-md text-white placeholder-gray-400"
          placeholder="Type it. I’ll make it shine…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(); }}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 px-4 py-2 rounded-md font-semibold"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>

      {role === "referrer" && (
        <div className="p-4 border-t border-gray-900 bg-[#0b0b0b]">
          <LeadQuickCapture />
        </div>
      )}
    </div>
  );
}
