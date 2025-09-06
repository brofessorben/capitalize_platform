"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import SuggestedPrompts from "./suggestedprompts";
import { getSupabase } from "@/lib/supabaseClient";

export default function AIChatPage({ role = "referrer", header = "Console" }) {
  const supabase = getSupabase();

  // threads
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);

  // messages for the active thread
  const [messages, setMessages] = useState([]);

  // composer
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);

  // ---------- load threads ----------
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false })
        .limit(50);

      setThreads(data || []);
      if (!activeThreadId && (data?.length ?? 0) > 0) {
        setActiveThreadId(data[0].id);
      }
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

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ---------- load & subscribe to messages for active thread ----------
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

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

    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeThreadId, supabase]);

  // ---------- scroll to bottom on new messages ----------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------- helpers ----------
  async function ensureThread() {
    if (activeThreadId) return activeThreadId;

    const titleSeed =
      input.trim().slice(0, 60) ||
      "New Thread";

    const { data, error } = await supabase
      .from("events")
      .insert([{ title: titleSeed, role, status: "open" }])
      .select()
      .single();

    if (error) {
      console.error("create thread error", error);
      return null;
    }

    setThreads((prev) => [data, ...prev]);
    setActiveThreadId(data.id);
    return data.id;
  }

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content) return;

    const threadId = await ensureThread();
    if (!threadId) return;

    // insert user message
    const { error: insErr } = await supabase
      .from("messages")
      .insert([{ event_id: threadId, role, content }]);

    if (insErr) {
      console.error("insert message error", insErr);
      return;
    }

    setInput("");

    // ask the assistant to reply
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: threadId,
          role,
          content,
        }),
      });
      // The assistant reply will arrive via realtime subscription.
    } catch (e) {
      console.error("chat call failed", e);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const lastUserText = useMemo(() => {
    // last non-assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== "assistant") return messages[i].content || "";
    }
    return "";
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#0b0d0c] text-white">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{header}</h2>
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
      <div className="px-5 pb-3 flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="rounded-lg border border-[#1e2a23] bg-[#0f1713] p-4 text-[#b7d9c6]">
            Pick a thread below or just start typing — I’ll spin up a new one.
          </div>
        )}

        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {/* Suggestions — single location, under the latest msg */}
        <SuggestedPrompts
          role={role}
          lastText={lastUserText}
          onPick={(t) => send(t)}
          compact={Boolean(messages.length)}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="px-5 pb-5">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={Math.min(8, Math.max(2, Math.ceil(input.length / 40)))}
            placeholder="Type to start a new thread…"
            className="flex-1 resize-none rounded-md border border-[#203128] bg-[#0e1713] px-3 py-2 outline-none focus:border-[#2c5e45]"
          />
          <button
            onClick={() => send()}
            className="rounded-md bg-[#1a6a44] hover:bg-[#178950] px-4 py-2 font-medium"
          >
            Send
          </button>
        </div>
        <div className="text-xs mt-1 text-[#8fb4a3]">Enter = send • Shift+Enter = newline</div>
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
                      <div className="text-xs text-[#7ea293]">{new Date(t.created_at).toLocaleString()}</div>
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
