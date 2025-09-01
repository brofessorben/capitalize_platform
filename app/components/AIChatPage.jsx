// app/components/AIChatPage.jsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function AIChatPage({ role = "referrer", header = "" }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: seedGreeting(role),
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef(null);

  // lead-capture panel state
  const [referrer, setReferrer] = useState({ name: "", email: "" });
  const [host, setHost] = useState({ name: "", contact: "" });
  const [vendor, setVendor] = useState({ name: "", contact: "", website: "" });
  const [notes, setNotes] = useState("");
  const [intro, setIntro] = useState({ subject: "", email: "", sms: "" });
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function sendChat(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");

    setMessages((m) => [...m, { role: "user", text, ts: Date.now() }]);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sender: role }),
      });
      const data = await r.json();
      const reply = data?.reply || "👍";
      setMessages((m) => [...m, { role: "assistant", text: reply, ts: Date.now() }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Hmmm, I hit an error. Try again?", ts: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function draftIntro() {
    setDrafting(true);
    setIntro({ subject: "", email: "", sms: "" });
    setNotice("");

    try {
      const r = await fetch("/api/draft-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrer, host, vendor, notes, role }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Draft error");
      setIntro({
        subject: data.subject,
        email: data.emailBody,
        sms: data.smsBody,
      });
      setNotice("Draft ready. Copy/paste or tweak, then save/send.");
    } catch (e) {
      setNotice("Couldn’t draft right now. Add OPENAI_API_KEY to enable smarter drafts.");
    } finally {
      setDrafting(false);
    }
  }

  async function saveLead() {
    setSaving(true);
    setNotice("");
    try {
      const r = await fetch("/api/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrer, host, vendor, notes }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Save failed");
      setNotice("Saved! You can keep chatting or draft another intro.");
    } catch (e) {
      setNotice(
        "Couldn’t save to DB. If you’re not using Supabase yet, that’s fine—copy your draft and continue."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="font-black tracking-tight">{header || headerFor(role)}</div>
          <div className="text-xs text-neutral-400">Powered by OpenAI · CAP 🜲</div>
        </div>
      </div>

      {/* Main: chat + lead panel */}
      <div className="mx-auto max-w-7xl px-6 py-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Chat */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 overflow-hidden">
          <div ref={scrollerRef} className="h-[65vh] overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <Bubble key={i} who={m.role} text={m.text} />
            ))}
          </div>
          <form onSubmit={sendChat} className="border-t border-neutral-900 p-3 flex gap-2">
            <input
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 h-11 outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Ask anything — e.g., “Find a BBQ caterer in Nashville”"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              disabled={busy || !input.trim()}
              className="px-5 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy ? "…" : "Send"}
            </button>
          </form>
        </div>

        {/* Lead quick capture */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4 space-y-4">
          <div className="text-sm font-semibold text-neutral-200">Lead Quick Capture</div>

          <Fieldset label="Referrer">
            <TwoCol>
              <Input label="Name" value={referrer.name} onChange={(v) => setReferrer({ ...referrer, name: v })} />
              <Input label="Email" value={referrer.email} onChange={(v) => setReferrer({ ...referrer, email: v })} />
            </TwoCol>
          </Fieldset>

          <Fieldset label="Host">
            <TwoCol>
              <Input label="Name" value={host.name} onChange={(v) => setHost({ ...host, name: v })} />
              <Input
                label="Phone / Email"
                value={host.contact}
                onChange={(v) => setHost({ ...host, contact: v })}
              />
            </TwoCol>
          </Fieldset>

          <Fieldset label="Vendor">
            <TwoCol>
              <Input label="Name" value={vendor.name} onChange={(v) => setVendor({ ...vendor, name: v })} />
              <Input
                label="Phone / Email"
                value={vendor.contact}
                onChange={(v) => setVendor({ ...vendor, contact: v })}
              />
            </TwoCol>
            <Input
              label="Website (optional)"
              value={vendor.website}
              onChange={(v) => setVendor({ ...vendor, website: v })}
            />
          </Fieldset>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Notes / Context</label>
            <textarea
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm min-h-[72px] outline-none focus:ring-2 focus:ring-emerald-500/30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Budget, headcount, date, dietary, vibe…"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={draftIntro}
              disabled={drafting}
              className="px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
              type="button"
            >
              {drafting ? "Drafting…" : "Draft Intro"}
            </button>
            <button
              onClick={saveLead}
              disabled={saving}
              className="px-4 h-10 rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-50"
              type="button"
            >
              {saving ? "Saving…" : "Save Lead"}
            </button>
          </div>

          {!!notice && <div className="text-xs text-neutral-400">{notice}</div>}

          {!!intro.email && (
            <div className="space-y-3 pt-2 border-t border-neutral-900">
              <div className="text-xs text-neutral-400">Intro Drafts</div>
              <CopyBlock label="Subject" text={intro.subject} />
              <CopyBlock label="Email" text={intro.email} />
              <CopyBlock label="SMS" text={intro.sms} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- tiny components ---------- */
function Bubble({ who, text }) {
  const me = who === "user";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm border ${
          me
            ? "bg-emerald-700 text-white border-emerald-800"
            : "bg-neutral-900 text-neutral-100 border-neutral-800"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function Fieldset({ label, children }) {
  return (
    <div>
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TwoCol({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Input({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="block text-xs text-neutral-400 mb-1">{label}</label>
      <input
        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <div className="relative">
        <textarea
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm min-h-[120px]"
          value={text}
          readOnly
        />
        <button
          onClick={() => {
            navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          type="button"
          className="absolute top-2 right-2 text-xs px-2 h-7 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function headerFor(role) {
  if (role === "vendor") return "Vendor Console";
  if (role === "host") return "Host Console";
  return "Referrer Console";
}

function seedGreeting(role) {
  const intros = [
    "Yo! I’m your CAPITALIZE co-pilot. Ask me anything or tell me who you’re connecting. I’ll help draft the intro and keep momentum.",
    "Howdy — I keep things fast & fun. Drop the host + vendor details and I’ll spin up a clean intro and next steps.",
    "What’s up! Share the people you’re connecting (or ask me to find local vendors) and I’ll do the rest.",
  ];
  const pick = intros[Math.floor(Math.random() * intros.length)];
  if (role === "referrer") {
    return (
      pick +
      " For referrers: include the **vendor name + contact**, plus the **host name + phone/email** and any context (date, headcount, budget). I’ll draft the intro and we’ll take it from there."
    );
  }
  if (role === "host") {
    return (
      pick +
      " For hosts: tell me the **date, headcount, budget, vibe**, and anything special. I’ll help you compare options and draft messages."
    );
  }
  if (role === "vendor") {
    return (
      pick +
      " For vendors: paste a brief offer (price, minimums, what’s included) and I’ll help respond to leads like a pro."
    );
  }
  return pick;
}
