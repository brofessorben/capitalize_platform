// app/components/aichatpage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { listEvents, createEvent, listMessages, addMessage } from "@/lib/chatStore";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";
import SuggestedPrompts from "./suggestedprompts";

export default function AIChatPage({ role, header }) {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // load events for this role
  useEffect(() => {
    (async () => {
      const list = await listEvents(role);
      setEvents(list);
      if (list.length && !eventId) setEventId(list[0].id);
    })();
  }, [role]);

  // load + subscribe to messages for selected event
  useEffect(() => {
    if (!eventId) return;

    let abort = false;
    (async () => {
      const data = await listMessages(eventId);
      if (!abort) setMessages(data);
    })();

    const supabase = getSupabase();
    const channel = supabase
      .channel(`msg-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${eventId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => {
      abort = true;
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text) {
    if (!text?.trim()) return;
    if (!eventId) return; // must have a thread selected
    await addMessage(eventId, role, text.trim());
    setInput("");
  }

  async function handleNewThread() {
    const title = prompt("Name this thread:");
    if (!title) return;
    const ev = await createEvent(title, role);
    setEvents((prev) => [ev, ...prev]);
    setEventId(ev.id);
    setMessages([]);
  }

  function handlePickSuggestion(t) {
    setInput(t);
  }

  return (
    <div className="flex flex-col min-h-[70vh] bg-[#0b0f0d] text-[#e9fff2]">
      <div className="px-4 py-4 border-b border-[#24322a] flex items-center justify-between">
        <h2 className="text-xl font-bold">{header}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleNewThread}
            className="rounded-md px-3 py-1.5 text-sm border border-[#2b4b3a] bg-[#0f1a14] text-[#baf7ca] hover:bg-[#143021] transition"
          >
            + New Thread
          </button>
        </div>
      </div>

      {/* Suggestions below header */}
      <div className="px-4 pt-3">
        <SuggestedPrompts role={role} onPick={handlePickSuggestion} />
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3">
        {!eventId && (
          <div className="rounded-lg border border-[#2b4b3a] bg-[#0f1a14] p-4 text-[#baf7ca]">
            Pick or create a thread to start chatting.
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-[#0e1512] border border-[#24322a] px-3 py-2 text-sm placeholder-[#7fb79a] focus:outline-none"
            placeholder="Type it. I’ll make it shine…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(input);
            }}
          />
          <button
            onClick={() => handleSend(input)}
            className="rounded-md px-4 py-2 font-semibold bg-[#15a362] text-white hover:opacity-90"
          >
            Send
          </button>
        </div>
      </div>

      {/* role-specific capture (referrer only) */}
      {role === "referrer" && (
        <div className="px-4 pb-8">
          <LeadQuickCapture />
        </div>
      )}

      {/* Bottom dashboard: your threads */}
      <div className="px-4 pb-10">
        <EventList
          items={events}
          selectedId={eventId}
          onSelect={(id) => setEventId(id)}
          onNew={handleNewThread}
        />
      </div>
    </div>
  );
}
