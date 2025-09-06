"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";
import SuggestedPrompts from "./suggestedprompts";
import EventList from "./eventlist"; // the bottom thread list

export default function AIChatPage({ role, header }) {
  const supabase = getSupabase();

  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const endRef = useRef(null);

  // load + realtime for current thread
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("event_id", threadId)
        .order("created_at", { ascending: true });
      if (!cancelled && !error) setMessages(data || []);
    };
    load();

    const ch = supabase
      .channel(`realtime-messages-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${threadId}` },
        (payload) => setMessages((m) => [...m, payload.new])
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // adaptive suggestions: fall back to bank until server returns smarter ones
  const lastUserMsg = useMemo(() => {
    const rev = [...messages].reverse();
    return rev.find((m) => m.role !== "assistant")?.content || "";
  }, [messages]);

  const defaultBank = {
    referrer: [
      "Draft an intro between vendor + host",
      "Summarize this lead and next steps",
      "Find 3 local vendors with menus",
      "Turn this into a text I can send",
      "Write a tight follow-up",
    ],
    vendor: [
      "Make good/better/best packages",
      "Ask 5 clarifying questions",
      "Turn this into a proposal",
      "Spin a short pitch email",
    ],
    host: [
      "Turn this plan into a vendor request",
      "Suggest 3 matching vendors",
      "Create a simple timeline",
      "List hidden costs to watch",
    ],
  };
  const seedSuggestions = suggestions.length ? suggestions : (defaultBank[role] || defaultBank.referrer);

  async function ensureThread(title) {
    if (threadId) return threadId;
    const r = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title?.slice(0, 120) || "New Thread", role }),
    });
    const j = await r.json();
    setThreadId(j?.id);
    return j?.id;
  }

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setSending(true);

    // create thread on first send
    const id = await ensureThread(msg);

    // optimistic user bubble
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, event_id: id, role, content: msg }]);
    setInput("");

    // hit API -> OpenAI (+ optional web)
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: id, role, content: msg, allow_web: true }),
    }).catch(() => null);

    if (r?.ok) {
      const j = await r.json();
      if (Array.isArray(j?.suggestions)) setSuggestions(j.suggestions);
      // assistant message is inserted server-side; realtime will append it
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{header}</h2>
        {/* quick-create thread */}
        <button
          className="rounded-md bg-[#103221] border border-[#1f3b2d] px-3 py-1 text-[#c9fdd7] hover:bg-[#143021]"
          onClick={() => setThreadId(null)}
          title="Start a fresh thread on next send"
        >
          + New Thread
        </button>
      </header>

      {/* static seed suggestions (top) */}
      <SuggestedPrompts role={role} compact onPick={(t) => send(t)} />

      {/* chat stream */}
      <div className="min-h-[220px] rounded-xl border border-[#203227] bg-[#0b0f0d] p-3 space-y-3">
        {messages.length === 0 && (
          <div className="rounded-md border border-[#1f3b2d] bg-[#0f1a14] px-3 py-2 text-[#b8eacd]">
            Pick a thread below or just start typing — I’ll spin up a new one.
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>

      {/* adaptive suggestions (below last message) */}
      <div className="flex flex-wrap gap-2">
        {seedSuggestions.map((t, i) => (
          <button
            key={i}
            onClick={() => send(t)}
            className="rounded-full px-3 py-1 text-sm bg-[#0f1a14] border border-[#1f3b2d] text-[#c9fdd7] hover:bg-[#143021] transition"
          >
            {t}
          </button>
        ))}
      </div>

      {/* composer */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md bg-[#0e1720] border border-[#213345] px-3 py-2 text-white placeholder-slate-400"
          placeholder={threadId ? "Type your message…" : "Type to start a new thread…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? (e.preventDefault(), send()) : null)}
          disabled={sending}
        />
        <button
          className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          onClick={() => send()}
          disabled={sending}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>

      {/* referrer-only capture */}
      {role === "referrer" && <LeadQuickCapture />}

      {/* bottom threads list */}
      <EventList role={role} onSelect={(id) => setThreadId(id)} />
    </div>
  );
}
