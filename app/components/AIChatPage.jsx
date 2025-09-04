// app/components/AIChatPage.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";           // uses react-markdown + remark-gfm
import LeadQuickCapture from "./LeadQuickCapture"; // your existing form component

// Small helper: auto-resize a textarea
function autosize(el) {
  if (!el) return;
  el.style.height = "0px";
  const h = Math.min(240, el.scrollHeight); // cap growth so it doesn't eat the screen
  el.style.height = h + "px";
}

const seedGreeting = (role) => {
  if (role === "vendor") {
    return `Howdy — I keep things fast & fun. Drop the host + vendor details and I’ll spin up a clean intro and next steps. For vendors: paste a brief offer (price, minimums, what’s included) and I’ll help respond to leads like a pro.`;
  }
  if (role === "host") {
    return `What’s up! Share the people you’re connecting (or ask me to find local vendors) and I’ll do the rest. For hosts: tell me the **date, headcount, budget, vibe**, and anything special. I’ll help you compare options and draft messages.`;
  }
  // default: referrer
  return `Yo! I’m your CAPITALIZE co-pilot. Paste vendor + host details and any context (date, headcount, budget). I’ll draft a clean intro or a proposal.`;
};

export default function AIChatPage({ role = "referrer", header = "" }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: seedGreeting(role), ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lead, setLead] = useState({
    referrerName: "", referrerEmail: "",
    hostName: "", hostContact: "",
    vendorName: "", vendorContact: "",
    website: "", notes: ""
  });

  const textareaRef = useRef(null);
  const scrollerRef = useRef(null);

  // keep textarea sizing snappy
  useEffect(() => { autosize(textareaRef.current); }, [input]);

  // scroll to bottom on new messages
  useEffect(() => {
    scrollerRef.current?.scrollTo?.(0, scrollerRef.current.scrollHeight);
  }, [messages, busy]);

  // Very light fallback extraction (in case API doesn't return leadHints)
  function extractToLead(text, appendNotes = false) {
    const next = { ...lead };
    const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    const phone = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];
    if (email && !next.hostContact) next.hostContact = email;
    if (phone && !next.hostContact) next.hostContact = phone;
    if (appendNotes) next.notes = (next.notes ? next.notes + "\n" : "") + text.slice(0, 400);
    setLead(next);
  }

  async function onSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    const userMsg = { role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          style: role, // tiny hint to API (referrer/vendor/host)
        }),
      });

      if (!r.ok) {
        const err = await r.text();
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "Error talking to AI. Try again.", ts: Date.now() },
        ]);
        console.error(err);
        return;
      }

      const data = await r.json();
      const reply = data?.text || "Hmm, try that again?";
      setMessages((m) => [...m, { role: "assistant", text: reply, ts: Date.now() }]);

      // Prefer structured hints from server; fallback to light extraction
      if (data?.leadHints && typeof data.leadHints === "object") {
        setLead((prev) => ({ ...prev, ...data.leadHints }));
      } else {
        extractToLead(reply, true);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Network error. Try again.", ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      // Cmd/Ctrl + Enter = send
      e.preventDefault();
      onSend();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      // plain Enter inserts newline (do nothing special)
      // Allow default behavior; we still autoresize
      return;
    }
  }

  return (
    <div className="w-full">
      {/* Header (optional) */}
      {header ? (
        <div className="text-sm text-gray-300 mb-2">{header}</div>
      ) : null}

      {/* Chat card */}
      <div className="rounded-2xl bg-neutral-900/70 p-4 shadow-lg ring-1 ring-white/10">
        <div
          ref={scrollerRef}
          className="max-h-[52vh] overflow-y-auto pr-1"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} />
          ))}

          {busy && (
            <ChatBubble role="assistant" text="Got it — give me a sec while I think that through." />
          )}
        </div>

        {/* Composer */}
        <div className="mt-3 flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-xl bg-neutral-800 text-neutral-100 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/70 placeholder:text-neutral-400"
            placeholder="Type your message… (Enter = newline, Cmd/Ctrl+Enter = send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
          />
          <button
            onClick={onSend}
            disabled={busy || !input.trim()}
            className="rounded-xl px-5 py-3 font-medium bg-blue-600 disabled:bg-blue-600/40 hover:bg-blue-500 transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Lead form (auto-filled, user can edit) */}
      <div className="mt-6">
        <LeadQuickCapture
          value={lead}
          onChange={setLead}
          onDraftIntro={() => {
            // Optional: push a prompt into chat to draft the intro with current form data
            const concat = [
              lead.referrerName && `Referrer: ${lead.referrerName} ${lead.referrerEmail || ""}`,
              lead.hostName && `Host: ${lead.hostName} ${lead.hostContact || ""}`,
              lead.vendorName && `Vendor: ${lead.vendorName} ${lead.vendorContact || ""}`,
              lead.website && `Website: ${lead.website}`,
              lead.notes && `Notes: ${lead.notes}`
            ].filter(Boolean).join("\n");
            setInput(`Draft the intro/proposal from these details:\n${concat}`);
          }}
        />
      </div>
    </div>
  );
} 
