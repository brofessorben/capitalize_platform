// app/components/aichatpage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { listThreads, createThread, listMessages, sendMessage, subscribeMessages } from "@/lib/chatStore";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";
import SuggestedPrompts from "./suggestedprompts";

export default function AIChatPage({ role, header }) {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Load threads on mount
  useEffect(() => {
    (async () => {
      const { data } = await listThreads(role);
      setThreads(data || []);
      if (data && data.length) {
        setSelected(data[0]);
      }
    })();
  }, [role]);

  // Load messages + realtime when a thread is selected
  useEffect(() => {
    if (!selected) return;

    let unsub = () => {};
    (async () => {
      const { data } = await listMessages(selected.id);
      setMessages(data || []);

      unsub = subscribeMessages(selected.id, (row) => {
        setMessages((prev) => [...prev, row]);
      });
    })();

    return () => unsub();
  }, [selected]);

  // autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(text) {
    if (!selected) return alert("Pick or create a thread first.");
    const payload = (text ?? input).trim();
    if (!payload) return;
    const { error } = await sendMessage(selected.id, role, payload);
    if (!error) setInput("");
  }

  async function handleCreateThread() {
    const title = prompt("New thread title:");
    if (!title) return;
    const { data, error } = await createThread(title, role);
    if (error) return alert(error.message);
    setThreads((t) => [data, ...t]);
    setSelected(data);
  }

  // naive contextual suggestions based on the last message
  const lastLine = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const extra =
    lastLine.includes("bbq") ? ["Find 3 Nashville BBQ trucks with menus", "Draft outreach message to BBQ vendors"] :
    lastLine.includes("budget") ? ["Propose 3 budget tiers", "Ask clarifying Qs about budget + headcount"] :
    [];

  return (
    <div className="flex flex-col min-h-[80vh] bg-[#0b0f0d] text-white rounded-2xl">
      <div className="flex items-center justify-between p-4 border-b border-[#1b2a24]">
        <h2 className="text-xl font-bold">{header}</h2>
        <button
          className="rounded-md bg-[#14452f] px-3 py-1 text-sm font-medium text-[#c9fdd7] hover:bg-[#1b5a3d]"
          onClick={handleCreateThread}
        >
          + New Thread
        </button>
      </div>

      <div className="p-4">
        <SuggestedPrompts
          role={role}
          onPick={(t) => handleSend(t)}
          compact
        />
        {extra.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {extra.map((t, i) => (
              <button
                key={i}
                onClick={() => handleSend(t)}
                className="rounded-full px-3 py-1 text-sm bg-[#102218] border border-[#1f3b2d] text-[#c9fdd7] hover:bg-[#143021] transition"
                title={t}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!selected ? (
          <div className="rounded-lg border border-[#233] bg-[#101614] p-3 text-[#bfead1]">
            Pick or create a thread to start chatting.
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border border-[#233] bg-[#101614] p-3 text-[#bfead1]">
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((m) => (
            <ChatBubble key={m.id} role={m.role} content={m.content} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-[#1b2a24] flex gap-2">
        <input
          className="flex-1 p-2 bg-[#111a16] rounded text-white placeholder-[#7aa998] border border-[#223]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selected ? "Type it. I’ll make it shine…" : "Pick or create a thread first…"}
          disabled={!selected}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend();
          }}
        />
        <button
          className="bg-emerald-600 px-4 py-2 rounded font-semibold disabled:opacity-50"
          disabled={!selected}
          onClick={() => handleSend()}
        >
          Send
        </button>
      </div>

      {role === "referrer" && (
        <div className="p-4">
          <LeadQuickCapture />
        </div>
      )}

      {/* Bottom thread list */}
      <div className="p-4">
        <div className="rounded-xl border border-[#233] bg-[#0f1412]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="font-semibold text-[#c9fdd7]">Your Threads</div>
            <button
              onClick={handleCreateThread}
              className="rounded-md bg-[#14452f] px-3 py-1 text-sm font-medium text-[#c9fdd7] hover:bg-[#1b5a3d]"
            >
              + New Thread
            </button>
          </div>
          <div className="border-t border-[#1b2a24]" />
          <ul className="p-2">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setSelected(t)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition ${
                    selected?.id === t.id
                      ? "bg-[#173426] text-[#d7ffe6] border border-[#23513b]"
                      : "bg-transparent text-[#bfead1] hover:bg-[#13271e]"
                  }`}
                >
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {t.role} • {t.status}
                  </div>
                </button>
              </li>
            ))}
            {threads.length === 0 && (
              <li className="p-3 text-sm text-[#9fb8ac]">No threads yet. Make one!</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
