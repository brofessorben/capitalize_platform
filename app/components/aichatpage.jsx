"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnon);

function useAutoScroll(dep) {
  const listRef = useRef(null);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [dep]);
  return listRef;
}

export default function AIChatPage({
  role = "referrer",
  header = "Console",
  initialEventId = null,
}) {
  const [eventId, setEventId] = useState(initialEventId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (initialEventId) setEventId(initialEventId);
  }, [initialEventId]);

  // Fetch + realtime
  useEffect(() => {
    let sub;
    async function run() {
      if (!eventId) {
        setMessages([]);
        return;
      }
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (!error && data) setMessages(data);

      sub = supabase
        .channel(`messages-event-${eventId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${eventId}` },
          (payload) => setMessages((m) => [...m, payload.new])
        )
        .subscribe();
    }
    run();
    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [eventId]);

  const listRef = useAutoScroll(messages);

  async function insertUserMessage(text) {
    const { error } = await supabase
      .from("messages")
      .insert([{ event_id: eventId, role, content: text }]);
    if (error) throw error;
  }

  // Call server AI route; assistant will insert message server-side
  async function triggerAI() {
    const r = await fetch("/api/ai/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, role }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      console.error("AI call failed:", j?.error || r.statusText);
    }
  }

  async function send(text) {
    const clean = (text ?? input ?? "").trim();
    if (!clean || !eventId) return;
    try {
      setSending(true);
      await insertUserMessage(clean);
      setInput("");
      await triggerAI();
    } catch (e) {
      console.error("send failed:", e?.message || e);
      alert("Send failed. Open console for details.");
    } finally {
      setSending(false);
    }
  }

  const suggestions = useMemo(
    () => [
      "Draft an intro between vendor + host",
      "Summarize this lead and next steps",
      "Find 3 local vendors with menus",
      "Turn this into a text I can send",
      "Write a tight follow-up",
    ],
    []
  );

  function onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{header}</h2>
        <div className="text-xs opacity-70">
          {eventId ? `Thread: ${eventId}` : "No thread selected"}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm hover:bg-emerald-400/20"
          >
            {s}
          </button>
        ))}
      </div>

      <div
        ref={listRef}
        className="mb-3 h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3"
      >
        {messages.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-60">
            {eventId ? "No messages yet. Say hi!" : "Create or select a thread to start."}
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="text-sm">
                <span className="mr-2 rounded bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                  {m.role}
                </span>
                <span>{m.content}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-start gap-2">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type here. Enter = newline. Ctrl/Cmd+Enter = Send."
          className="min-h-[56px] w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 outline-none"
        />
        <button
          type="button"
          disabled={sending || !eventId || !input.trim()}
          onClick={() => send()}
          className="h-[56px] shrink-0 rounded-xl bg-emerald-500 px-4 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>

      <div className="mt-1 text-xs opacity-50">
        Pro tip: press <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd> to send.
      </div>
    </div>
  );
}
