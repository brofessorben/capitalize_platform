"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import SuggestedPrompts from "./SuggestedPrompts";

export default function AIChatPage({
  role = "referrer",
  header = "CAPITALIZE • Copilot",
  initialEventId = null,
}) {
  const supabase = getSupabase();

  const [userId, setUserId] = useState(null);
  const [eventId, setEventId] = useState(initialEventId); // will create one if missing
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const endRef = useRef(null);

  // auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // boot: get user, ensure we have an event (thread), load + subscribe
  useEffect(() => {
    let channel;
    (async () => {
      // 1) who’s logged in
      const { data: sess } = await supabase.auth.getSession();
      const u = sess?.session?.user;
      if (!u) {
        setLoading(false);
        return;
      }
      setUserId(u.id);

      // 2) ensure an event/thread exists
      let eid = initialEventId;
      if (!eid) {
        // get or create a default thread for this user
        const { data: existing, error: exErr } = await supabase
          .from("events")
          .select("id")
          .eq("owner_user_id", u.id)
          .order("created_at", { ascending: true })
          .limit(1);
        if (exErr) console.error(exErr);

        if (existing && existing.length) {
          eid = existing[0].id;
        } else {
          const { data: created, error: crErr } = await supabase
            .from("events")
            .insert([{ owner_user_id: u.id, title: "New thread" }])
            .select("id")
            .single();
          if (crErr) console.error(crErr);
          eid = created?.id || null;
        }
      }
      setEventId(eid);

      if (!eid) {
        setLoading(false);
        return;
      }

      // 3) load existing messages
      const { data: initial, error: loadErr } = await supabase
        .from("messages")
        .select("*")
        .eq("event_id", eid)
        .order("created_at", { ascending: true });
      if (loadErr) console.error(loadErr);
      setMessages(initial || []);

      // 4) subscribe to live inserts for this thread
      channel = supabase
        .channel(`realtime-messages-${eid}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${eid}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      setLoading(false);
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, initialEventId]);

  // send helper
  async function send(text) {
    if (!text || !text.trim() || !eventId) return;
    const clean = text.trim();

    // optimistic echo of MY message so UI feels instant
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      event_id: eventId,
      role,
      content: clean,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, tempUserMsg]);

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          role,
          content: clean,
        }),
      });
      if (!res.ok) {
        console.error("chat POST failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  // click suggestion → send immediately
  function handlePickSuggestion(t) {
    setInput("");
    send(t);
  }

  function onKeyDown(e) {
    // Enter = newline; Cmd/Ctrl+Enter = send
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send(input);
      setInput("");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-neutral-300">
        Warming up your copilot…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0b0b] text-white rounded-2xl overflow-hidden border border-[#1f3b2d]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1f3b2d]">
        <h2 className="text-lg font-semibold">{header}</h2>
        <div className="text-xs text-[#9adbb0]">{sending ? "Responding…" : ""}</div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Suggested prompts (context-aware later; for now role-based) */}
      <div className="px-4 pb-2">
        <SuggestedPrompts role={role} onPick={handlePickSuggestion} compact />
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-[#1f3b2d]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            placeholder="Type here. Enter = newline. Ctrl/Cmd+Enter = Send."
            className="flex-1 resize-none rounded-xl bg-[#0f1a14] border border-[#1f3b2d] placeholder-[#72b995] px-3 py-2.5 leading-relaxed focus:outline-none"
          />
          <button
            onClick={() => {
              const t = input;
              setInput("");
              send(t);
            }}
            disabled={!input.trim() || sending || !eventId}
            className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 font-semibold"
          >
            Send
          </button>
        </div>
        <div className="mt-1 text-[11px] text-[#72b995]">
          Pro tip: press Ctrl/Cmd + Enter to send.
        </div>
      </div>
    </div>
  );
}
