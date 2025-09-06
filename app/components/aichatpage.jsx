"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

export default function AIChatPage({
  role = "referrer",
  header = "Console",
  leadId,
  seed,
  showLeadForm = role === "referrer",
}) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const taRef = useRef(null);
  const listEndRef = useRef(null);

  const supabase = useMemo(() => getSupabase(), []);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [input]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      const { data, error } = leadId
        ? await query.eq("lead_id", leadId)
        : await query.is("lead_id", null);

      if (!mounted) return;

      if (error) {
        console.error("fetch messages error:", error);
        setMessages([]);
        return;
      }

      if (!data?.length && seed) {
        setMessages([{ id: "seed", role: "ai", content: seed, created_at: new Date().toISOString() }]);
      } else {
        setMessages(data || []);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [leadId, supabase, seed]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: leadId ? `lead_id=eq.${leadId}` : "lead_id=is.null",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, supabase]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setBusy(true);

    const { error: insertErr } = await supabase.from("messages").insert([
      {
        role: "user",
        content: text,
        lead_id: leadId ?? null,
      },
    ]);
    if (insertErr) {
      console.error("insert user message error:", insertErr);
      setBusy(false);
      return;
    }

    try {
      const history = [
        ...messages.filter((m) => m.id !== "seed").map((m) => ({
          role: m.role === "ai" ? "assistant" : m.role,
          content: m.content,
        })),
        { role: "user", content: text },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, messages: history, leadId }),
      });

      const j = await res.json();
      const reply = j?.reply?.toString() || "Got it.";

      const { error: aiErr } = await supabase.from("messages").insert([
        {
          role: "assistant",
          content: reply,
          lead_id: leadId ?? null,
        },
      ]);
      if (aiErr) console.error("insert assistant message error:", aiErr);
    } catch (e) {
      console.error("chat API error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: "ai",
          content:
            "Couldn't reach the server just now. Paste your details (event/date/headcount/budget/location/notes) and I’ll structure a clean message.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0b0c] text-white rounded-xl border border-neutral-800">
      <div className="p-4 text-lg font-semibold border-b border-neutral-800">
        {header}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            role={m.role === "assistant" || m.role === "ai" ? "ai" : m.role}
            content={m.content}
          />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
        <div ref={listEndRef} />
      </div>

      <div className="p-3 border-t border-neutral-800 flex items-end gap-2">
        <textarea
          ref={taRef}
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-lg bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-700 px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your message… (Cmd/Ctrl+Enter to send)"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>

      {showLeadForm && (
        <div className="border-t border-neutral-800 bg-neutral-950/40 p-4">
          <LeadQuickCapture
            onDraft={(lines) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: `draft-${Date.now()}`,
                  role: "ai",
                  content: (lines || []).join("\n"),
                  created_at: new Date().toISOString(),
                },
              ]);
            }}
          />
        </div>
      )}
    </div>
  );
}
