"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

const seeds = {
  referrer:
    "Yo! I’m your CAPITALIZE co-pilot. Drop the **vendor** + **host** details (names, contact, date, headcount, budget, notes). I’ll draft the intro and keep momentum.\n\n**Commands:**\n- `/search query` web search\n- `/news query` news search\n- `/maps query` Google Maps/Places\n\nEnter = newline • Cmd/Ctrl+Enter = Send",
  vendor:
    "Vendor console: paste **lead details** (event, date, headcount, budget, location, notes). I’ll draft a clean reply/proposal you can send.\n\n**Commands:** `/search`, `/news`, `/maps`",
  host:
    "Tell me what you’re planning (event, date, headcount, budget, location, vibe). I’ll generate a vendor request or proposal.\n\n**Commands:** `/search`, `/news`, `/maps`",
};

async function callChat(messages, role) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });
  if (!res.ok) throw new Error("chat failed");
  const data = await res.json();
  // Your /api/chat returns {reply}, normalize to content
  return data.reply || data.content || "Ready.";
}

async function callSearchWeb(q, mode = "web") {
  const res = await fetch("/api/search-web", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, mode }),
  });
  if (!res.ok) throw new Error("search failed");
  const data = await res.json();
  const items = data.results || [];
  if (!items.length) return "_No results._";
  return [
    `**Results for:** ${q}`,
    "",
    ...items.map(
      (r, i) =>
        `${i + 1}. [${r.title || r.link}](${r.link})  \n   ${r.snippet || ""}${r.source ? ` — _${r.source}_` : ""}${
          r.date ? ` (${r.date})` : ""
        }`
    ),
  ].join("\n");
}

async function callMaps(q) {
  const res = await fetch("/api/maps-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  if (!res.ok) throw new Error("maps failed");
  const data = await res.json();
  const items = data.results || [];
  if (!items.length) return "_No places found._";
  return [
    `**Places for:** ${q}`,
    "",
    ...items.map(
      (p, i) =>
        `${i + 1}. **${p.name}** — ${p.address || ""}  \n   ⭐ ${p.rating ?? "N/A"} (${p.total_ratings ?? 0}) • [Open in Maps](${p.maps_url})`
    ),
  ].join("\n");
}

export default function AIChatPage({ role = "referrer", header = "Referrer Console" }) {
  const [messages, setMessages] = useState([
    { role: "ai", content: seeds[role] || seeds.referrer },
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");

  const taRef = useRef(null);

  // auto-grow the textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [input]);

  function push(role, content) {
    setMessages((m) => [...m, { role, content }]);
  }

  async function handleSlashCommands(text) {
    // /search foo
    if (text.startsWith("/search ")) {
      const q = text.replace("/search", "").trim();
      if (!q) return "_Usage: `/search your query`_";
      return await callSearchWeb(q, "web");
    }
    // /news foo
    if (text.startsWith("/news ")) {
      const q = text.replace("/news", "").trim();
      if (!q) return "_Usage: `/news your query`_";
      return await callSearchWeb(q, "news");
    }
    // /maps foo
    if (text.startsWith("/maps ")) {
      const q = text.replace("/maps", "").trim();
      if (!q) return "_Usage: `/maps your place or type`_";
      return await callMaps(q);
    }
    return null; // no slash command, let chat handle
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    push("user", text);
    setBusy(true);

    try {
      const cmdResult = await handleSlashCommands(text);
      if (cmdResult) {
        push("ai", cmdResult);
      } else {
        const reply = await callChat([...messages, { role: "user", content: text }], role);
        push("ai", reply);
      }
    } catch (e) {
      push("ai", "_Couldn’t reach the server. Try again in a moment._");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-xl font-semibold mb-4 text-white">{header}</div>

      <div className="space-y-3 mb-4 max-h-[58vh] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role === "user" ? "user" : "ai"} content={m.content} />
        ))}
        {busy && <ChatBubble role="ai" content="_Typing…_" />}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter = newline, Cmd/Ctrl+Enter = send
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your message…  (Use /search, /news, /maps)  |  Enter=newline, Cmd/Ctrl+Enter=Send"
          className="flex-1 min-h-[44px] max-h-[240px] resize-none rounded-xl bg-neutral-800 text-white placeholder-neutral-400 border border-neutral-700 px-3 py-2"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
          aria-label="Send"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>

      {/* Keep your form block under chat exactly as you have it */}
      {role === "referrer" && <LeadQuickCapture />}
    </div>
  );
}
