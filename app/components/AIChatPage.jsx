"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import LeadQuickCapture from "./LeadQuickCapture";

const seed = `Yo! I’m your CAPITALIZE co-pilot. Paste vendor + host details and any context (date, headcount, budget). I’ll draft a clean intro or a proposal.`;

export default function AIChatPage({ role = "referrer", header = "Referrer Console" }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: seed, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  // Lead form state (can be prefilled from chat)
  const [formData, setFormData] = useState({
    referrerName: "", referrerEmail: "",
    hostName: "", hostContact: "",
    vendorName: "", vendorContact: "",
    website: "", notes: ""
  });

  // --- autosizing textarea
  const taRef = useRef(null);
  const autosize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 240) + "px"; // cap at ~6 lines
  };
  useEffect(() => { autosize(); }, [input]);

  // --- simple parser to pull lead hints from plain text
  const parseLeadHints = (text) => {
    const out = {};
    const grab = (re, key) => {
      const m = text.match(re);
      if (m && m[1]) out[key] = m[1].trim();
    };
    grab(/vendor[:\-]\s*([^\n]+)/i, "vendorName");
    grab(/host[:\-]\s*([^\n]+)/i, "hostName");
    grab(/(phone|email|contact)[:\-]\s*([^\n]+)/i, "hostContact");
    grab(/budget[:\-]\s*([^\n]+)/i, "budget");
    grab(/date[:\-]\s*([^\n]+)/i, "date");
    grab(/headcount[:\-]\s*([^\n]+)/i, "headcount");

    // push recognized things into notes if present
    const notesBits = [];
    if (out.budget) notesBits.push(`Budget: ${out.budget}`);
    if (out.date) notesBits.push(`Date: ${out.date}`);
    if (out.headcount) notesBits.push(`Headcount: ${out.headcount}`);
    if (notesBits.length) out.notes = [formData.notes, notesBits.join(" • ")].filter(Boolean).join("\n");
    delete out.budget; delete out.date; delete out.headcount;
    return out;
  };

  // --- send message
  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const userMsg = { role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // prefill form from what user typed
    const hints = parseLeadHints(text);
    if (Object.keys(hints).length) setFormData((prev) => ({ ...prev, ...hints }));

    setBusy(true);
    try {
      // call your existing API (pages/api/chat.js)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, text }) => ({ role, content: text })), role }),
      });
      const data = await res.json();
      const reply = (data?.text || "Got it — give me a sec while I think that through.").trim();

      setMessages((m) => [...m, { role: "assistant", text: reply, ts: Date.now() }]);

      // also parse assistant output for additional hints
      const moreHints = parseLeadHints(reply);
      if (Object.keys(moreHints).length) setFormData((prev) => ({ ...prev, ...moreHints }));
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Oops, trouble reaching the brain. Try again in a moment.", ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-[#111] border border-white/10 p-4">
        <div className="text-white/90 font-semibold mb-3">{header}</div>

        {/* messages */}
        <div className="min-h-[200px] max-h-[420px] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} />
          ))}
        </div>

        {/* input */}
        <div className="mt-3 flex gap-3 items-end">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter = newline (default). Only Cmd/Ctrl+Enter sends.
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your message… (Enter = newline, Ctrl/Cmd+Enter = send)"
            className="flex-1 input"
            rows={1}
            style={{ resize: "none" }}
          />
          <button className="btn-send" onClick={send} disabled={busy}>
            {busy ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>

      {/* lead form */}
      <LeadQuickCapture
        formData={formData}
        setFormData={setFormData}
        onDraft={() => {
          const summary = [
            formData.vendorName && `**Vendor:** ${formData.vendorName} (${formData.vendorContact || "contact tbd"})`,
            formData.hostName && `**Host:** ${formData.hostName} (${formData.hostContact || "contact tbd"})`,
            formData.website && `**Website:** ${formData.website}`,
            formData.notes && `**Notes:** ${formData.notes}`,
          ]
            .filter(Boolean)
            .join("\n");

          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              text:
                summary
                  ? `Here’s a clean intro/proposal draft based on the details:\n\n${summary}\n\nIf you want, say “polish this” and I’ll format a final send-ready message.`
                  : "Fill in a couple fields or paste more context, then hit Draft again and I’ll polish it.",
              ts: Date.now(),
            },
          ]);
        }}
      />

      <style jsx>{`
        .input {
          background: #1d1d1d;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 10px 12px;
          color: #e5e7eb;
          outline: none;
          width: 100%;
        }
        .input::placeholder { color: #9ca3af; }
        .btn-send {
          background: #2563eb;
          color: white;
          border-radius: 12px;
          padding: 10px 16px;
          font-weight: 600;
          min-width: 96px;
        }
      `}</style>
    </div>
  );
}
