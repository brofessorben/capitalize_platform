"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import SuggestedPrompts from "./suggestedprompts";
import { getSupabase } from "@/lib/supabaseClient";

export default function AIChatPage({ role = "referrer", header = "Console" }) {
  const supabase = getSupabase();

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // load threads
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false })
        .limit(50);
      setThreads(data || []);
      if (!activeThreadId && (data?.length ?? 0) > 0) setActiveThreadId(data[0].id);
    };
    load();

    const ch = supabase
      .channel(`threads-${role}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `role=eq.${role}` },
        (payload) => setThreads((prev) => [payload.new, ...prev])
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // load + subscribe messages
  useEffect(() => {
    if (!activeThreadId) return setMessages([]);

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("event_id", activeThreadId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    load();

    const ch = supabase
      .channel(`messages-${activeThreadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${activeThreadId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [activeThreadId, supabase]);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ensureThread() {
    if (activeThreadId) return activeThreadId;
    const titleSeed = input.trim().slice(0, 60) || "New Thread";
    const { data, error } = await supabase
      .from("events")
      .insert([{ title: titleSeed, role, status: "open" }])
      .select()
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    setThreads((p) => [data, ...p]);
    setActiveThreadId(data.id);
    return data.id;
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content) return;
    const threadId = await ensureThread();
    if (!threadId) return;

    // user message
    const { error: insErr } = await supabase
      .from("messages")
      .insert([{ event_id: threadId, role, content }]);
    if (insErr) {
      console.error(insErr);
      return;
    }
    setInput("");

    // call assistant
    try {
      setIsTyping(true);
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: threadId, role, content }),
      });
    } catch (e) {
      console.error("chat call failed", e);
    } finally {
      // reply arrives via realtime, but we still stop the indicator
      setIsTyping(false);
    }
  }

  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== "assistant") return messages[i].content || "";
    }
    return "";
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#0b0d0c] text-white font-[ui-rounded]">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-wide">{header}</h2>
        <button
          onClick={async () => {
            const { data, error } = await supabase
              .from("events")
              .insert([{ title: "New Thread", role, status: "open" }])
              .select()
              .single();
            if (!error && data) {
              setThreads((p) => [data, ...p]);
              setActiveThreadId(data.id);
            }
          }}
          className="rounded-md bg-[#12341f] hover:bg-[#174f2b] px-3 py-2 text-sm"
        >
          + New Thread
        </button>
      </div>

      {/* Chat area */}
      <div className="px-5 pb-2 flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="rounded-lg border border-[#1e2a23] bg-[#0f1713] p-4 text-[#b7d9c6]">
            Pick a thread below or type—Enter makes a new line. Click <span className="font-semibold">Send</span> when ready.
          </div>
        )}

        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {/* Suggestions only here */}
        <SuggestedPrompts
          role={role}
          lastText={lastUserText}
          onPick={(t) => send(t)}
          compact={Boolean(messages.length)}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="px-5 pb-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={Math.min(8, Math.max(2, Math.ceil((input || "").length / 48)))}
            placeholder="Type your message… (Enter = newline)"
            className="flex-1 resize-none rounded-md border border-[#203128] bg-[#0e1713] px-3 py-2 outline-none focus:border-[#2c5e45]"
          />
          <button
            onClick={() => send()}
            className="rounded-md bg-[#1a6a44] hover:bg-[#178950] px-4 py-2 font-medium"
          >
            Send
          </button>
        </div>

        {/* Typing indicator */}
        <div className="mt-2 text-xs text-[#8fb4a3] flex items-center gap-2">
          {isTyping && (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#8fb4a3] animate-pulse" />
              Responding…
            </span>
          )}
        </div>
      </div>

      {/* Thread list footer */}
      <div className="px-5 pb-6">
        <div className="rounded-lg border border-[#1e2a23] bg-[#0f1713]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a23]">
            <div className="font-medium text-[#c9fdd7]">Your Threads</div>
          </div>
          <div className="p-2">
            {threads.length === 0 ? (
              <div className="text-sm text-[#88a698] px-2 py-3">No threads yet. Make one!</div>
            ) : (
              <ul className="divide-y divide-[#1e2a23]">
                {threads.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setActiveThreadId(t.id)}
                      className={`w-full text-left px-3 py-3 hover:bg-[#121c16] ${
                        activeThreadId === t.id ? "bg-[#121c16]" : ""
                      }`}
                    >
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-[#7ea293]">
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
