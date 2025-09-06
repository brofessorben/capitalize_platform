// app/components/aichatpage.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";           // your existing .tsx component
import LeadQuickCapture from "./LeadQuickCapture"; // keep if you want the form

function stripPolite(text) {
  return String(text || "")
    .replace(/^\s*(hey|hi|hello|please|can you|could you|would you)\b[:,\s]*/i, "")
    .trim();
}

export default function AIChatPage({ role = "referrer", header = "Console", eventId }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [activeEventId, setActiveEventId] = useState(eventId || null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  // auto-create a thread if none was passed (so dashboard can chat instantly)
  useEffect(() => {
    const ensureEvent = async () => {
      if (activeEventId) return;
      const { data, error } = await supabase
        .from("events")
        .insert([{ title: `Quick Chat — ${new Date().toLocaleString()}`, role, status: "open" }])
        .select("id")
        .single();
      if (!error && data?.id) setActiveEventId(data.id);
    };
    ensureEvent();
  }, [activeEventId, role]);

  // load + subscribe to messages for the active event
  useEffect(() => {
    if (!activeEventId) return;

    let sub;
    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("event_id", activeEventId)
        .order("created_at", { ascending: true });
      if (!error) setMessages(data || []);
      // scroll to bottom
      setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }), 50);
    };
    load();

    sub = supabase
      .channel(`msg-${activeEventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `event_id=eq.${activeEventId}` },
        load
      )
      .subscribe();

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [activeEventId]);

  async function sendMessage() {
    const text = stripPolite(draft);
    if (!text) return;

    setDraft("");
    setLoading(true);

    // Optimistic add of user msg
    const localUser = {
      id: crypto.randomUUID(),
      event_id: activeEventId,
      role,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, localUser]);

    // Call API -> will store both the user + assistant messages
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.concat(localUser).map(({ role, content }) => ({ role, content })),
        role,
        eventId: activeEventId,
      }),
    });
    const j = await r.json();
    // On success, realtime will pull assistant reply; nothing else to do.
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">{header}</h2>

      <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 mb-3 text-zinc-200">
        {role === "referrer" && (
          <div>
            Yo! I’m your CAPITALIZE co-pilot. Drop vendor + host details (names, contacts, event info) and I’ll draft the intro for you.
          </div>
        )}
        {role === "vendor" && (
          <div>
            Welcome to your vendor console. Paste the lead details (event, date, headcount, budget, location, notes) and I’ll draft a sharp reply or proposal.
          </div>
        )}
        {role === "host" && (
          <div>
            Welcome! Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll generate a clean vendor request.
          </div>
        )}
        <div className="text-xs text-emerald-400 mt-2">Tip: use <code>/search</code>, <code>/news</code>, <code>/maps</code></div>
      </div>

      {/* messages */}
      <div
        ref={listRef}
        className="rounded-2xl bg-zinc-950/50 border border-zinc-800 p-3 h-[50vh] overflow-y-auto space-y-2"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {!messages.length && (
          <div className="text-sm text-zinc-400">No messages yet. Say hi 👋</div>
        )}
      </div>

      {/* input */}
      <div className="flex gap-2 mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") sendMessage();
          }}
          placeholder="Type it. I’ll make it shine. (Cmd/Ctrl+Enter to send)"
          className="flex-1 rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!draft || loading}
          className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>

      {/* Optional capture block */}
      <div className="mt-6">
        <LeadQuickCapture />
      </div>
    </div>
  );
}
