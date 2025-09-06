"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";
import SuggestedPrompts from "./suggestedprompts";
import EventList from "./eventlist";

export default function AIChatPage({ role = "referrer", header = "Console" }) {
  const supabase = getSupabase();
  const [threads, setThreads] = useState([]);             // events rows
  const [activeThread, setActiveThread] = useState(null); // { id, title, role, ... }
  const [messages, setMessages] = useState([]);           // messages for active thread
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // load thread list for this role
  useEffect(() => {
    const loadThreads = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("role", role)
        .order("updated_at", { ascending: false });
      setThreads(data || []);
    };
    loadThreads();

    // realtime thread updates
    const ev = supabase
      .channel("events-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `role=eq.${role}` },
        () => loadThreads()
      )
      .subscribe();
    return () => supabase.removeChannel(ev);
  }, [role, supabase]);

  // load messages for the active thread
  useEffect(() => {
    if (!activeThread?.id) {
      setMessages([]);
      return;
    }

    const loadMsgs = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("event_id", activeThread.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    loadMsgs();

    const ch = supabase
      .channel(`messages-${activeThread.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${activeThread.id}` },
        (payload) => setMessages((m) => [...m, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [activeThread, supabase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ensures a thread exists; creates one if not
  const ensureThread = async () => {
    if (activeThread?.id) return activeThread;

    const title = input.trim() || "New Thread";
    const { data, error } = await supabase
      .from("events")
      .insert([{ title, role, status: "open" }])
      .select()
      .single();

    if (error) {
      console.error("create thread error", error);
      return null;
    }
    setActiveThread(data);
    return data;
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content) return;

    const thread = await ensureThread();
    if (!thread) return;

    setInput("");

    const { error } = await supabase.from("messages").insert([
      {
        event_id: thread.id,
        role,          // who is speaking: referrer | vendor | host
        content,
      },
    ]);
    if (error) console.error("send error", error);

    // Optimistic thread bump
    await supabase.from("events").update({ updated_at: new Date().toISOString() }).eq("id", thread.id);
  };

  const createThread = async () => {
    const title = prompt("Thread title?") || "New Thread";
    const { data, error } = await supabase
      .from("events")
      .insert([{ title, role, status: "open" }])
      .select()
      .single();
    if (error) return console.error("new thread error", error);
    setActiveThread(data);
  };

  const lastMsg = messages[messages.length - 1];

  return (
    <div className="flex flex-col min-h-[80vh] text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#203227] bg-[#0b0f0d]">
        <h2 className="text-xl font-semibold">{header}</h2>
        <button
          onClick={createThread}
          className="rounded-md bg-[#163626] hover:bg-[#1b4431] px-3 py-1.5 text-sm"
        >
          + New Thread
        </button>
      </div>

      {/* Contextual prompts */}
      <div className="px-4 pt-3">
        <SuggestedPrompts
          role={role}
          lastMessage={lastMsg?.content || ""}
          onPick={(t) => send(t)}
          compact={false}
        />
      </div>

      {/* Chat stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!activeThread && (
          <div className="rounded-md border border-[#1f2b24] bg-[#0f1713] p-4 text-[#cdebd9]">
            Pick a thread below or just start typing — I’ll spin up a new one.
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? send() : null)}
            placeholder={activeThread ? "Type it. I’ll make it shine…" : "Type to start a new thread…"}
            className="flex-1 rounded-md bg-[#0e1720] border border-[#213345] px-3 py-2"
          />
          <button
            onClick={() => send()}
            className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-semibold"
          >
            Send
          </button>
        </div>
      </div>

      {/* Lead capture only for referrers */}
      {role === "referrer" && (
        <div className="px-4 pb-4">
          <LeadQuickCapture />
        </div>
      )}

      {/* Thread list */}
      <div className="px-4 pb-8">
        <EventList
          items={threads}
          activeId={activeThread?.id}
          onSelect={(ev) => setActiveThread(ev)}
          onNew={createThread}
        />
      </div>
    </div>
  );
}
