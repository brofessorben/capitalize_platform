"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import SuggestedPrompts from "./suggestedprompts";
import LeadQuickCapture from "./LeadQuickCapture";

export default function AIChatPage({ role = "referrer", header = "Capitalize" }) {
  const supabase = getSupabase();
  const [userId, setUserId] = useState(null);
  const [eventId, setEventId] = useState<string | null>(null); // your page may set this; fallback below
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load user + pick a default event if none
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user?.id) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);

      // Fallback event_id if your page didn’t set one; you can replace with real thread picker
      setEventId((prev) => prev || "default");

      setLoading(false);
    })();
  }, [supabase]);

  // Load messages for this user + event
  useEffect(() => {
    if (!userId || !eventId) return;

    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (error) console.error("fetch messages error", error);
        setMessages(data || []);
      }
    };

    load();

    // realtime inserts for this event & user
    const channel = supabase
      .channel(`realtime-messages-${userId}-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new.event_id === eventId) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, eventId]);

  // Handle click on a suggested prompt
  const handlePickPrompt = (text: string) => {
    setInput(text);
  };

  // Send a message: write user message (with user_id), then call /api/chat to get assistant
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !userId || !eventId || sending) return;

    setSending(true);
    setInput("");

    // 1) insert the user’s message (RLS needs user_id)
    const { error: insertErr } = await supabase.from("messages").insert([
      {
        event_id: eventId,
        user_id: userId,
        role,           // "referrer" | "vendor" | "host"
        content: text,
      },
    ]);
    if (insertErr) {
      console.error("insert message error", insertErr);
      setSending(false);
      return;
    }

    // 2) ask the assistant (server will save assistant message with user_id)
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          role,
          content: text,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("chat route error", t);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-neutral-300">
        Loading chat…
      </div>
    );
  }

  if (!userId) {
    // gated by <UserGate/> up-stack; this is just a safety
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-neutral-300">
        Sign in to start chatting.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">{header}</h2>
        <div className="text-xs text-neutral-400">
          Event: <span className="font-mono">{eventId}</span>
        </div>
      </div>

      <div className="px-4 pt-3">
        <SuggestedPrompts role={role} onPick={handlePickPrompt} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-gray-800">
        <div className="flex gap-2">
          <textarea
            className="flex-1 resize-none h-[64px] p-2 bg-gray-900 rounded text-white outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type here… (Shift+Enter = new line, Enter = send)"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded font-semibold disabled:opacity-60"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        {sending && (
          <div className="text-xs text-neutral-400 mt-2">Responding…</div>
        )}
      </div>

      {role === "referrer" && (
        <div className="border-t border-gray-800">
          <LeadQuickCapture />
        </div>
      )}
    </div>
  );
}
