"use client";
import { useState } from "react";

export default function LeadQuickCapture({ onDraft }) {
  const [form, setForm] = useState({
    refName: "", refEmail: "",
    hostName: "", hostContact: "",
    vendorName: "", vendorContact: "",
    website: "", notes: ""
  });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function buildDraft() {
    const lines = [
      "### Intro",
      `I’d like to introduce **${form.vendorName || "Vendor"}** to **${form.hostName || "Host"}**.`,
      "",
      "#### Contacts",
      `- Vendor: ${form.vendorName || "N/A"} — ${form.vendorContact || "N/A"}`,
      `- Host: ${form.hostName || "N/A"} — ${form.hostContact || "N/A"}`,
      form.website && `- Website: ${form.website}`,
      "",
      "#### Context",
      form.notes || "(add date, headcount, budget, vibe…)"]
      .filter(Boolean).join("\n");

    onDraft?.(lines);
  }

  async function saveLead() {
    try {
      await fetch("/api/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      alert("Saved");
    } catch {
      alert("Could not save right now.");
    }
  }

  const inputCls =
    "w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-neutral-100 placeholder-neutral-500";

  return (
    <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="text-neutral-100 font-semibold mb-3">Lead Quick Capture</div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="text-sm text-neutral-400 mb-1">Referrer — Name</div>
          <input className={inputCls} value={form.refName} onChange={(e)=>set("refName",e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-neutral-400 mb-1">Referrer — Email</div>
          <input className={inputCls} value={form.refEmail} onChange={(e)=>set("refEmail",e.target.value)} />
        </div>

        <div>
          <div className="text-sm text-neutral-400 mb-1">Host — Name</div>
          <input className={inputCls} value={form.hostName} onChange={(e)=>set("hostName",e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-neutral-400 mb-1">Host — Phone / Email</div>
          <input className={inputCls} value={form.hostContact} onChange={(e)=>set("hostContact",e.target.value)} />
        </div>

        <div>
          <div className="text-sm text-neutral-400 mb-1">Vendor — Name</div>
          <input className={inputCls} value={form.vendorName} onChange={(e)=>set("vendorName",e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-neutral-400 mb-1">Vendor — Phone / Email</div>
          <input className={inputCls} value={form.vendorContact} onChange={(e)=>set("vendorContact",e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <div className="text-sm text-neutral-400 mb-1">Website (optional)</div>
          <input className={inputCls} value={form.website} onChange={(e)=>set("website",e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <div className="text-sm text-neutral-400 mb-1">Notes / Context</div>
          <textarea rows={4} className={inputCls}
            placeholder="Budget, headcount, date, dietary, vibe…"
            value={form.notes} onChange={(e)=>set("notes",e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={buildDraft}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2">
          Draft Intro
        </button>
        <button onClick={saveLead}
          className="rounded-xl bg-neutral-700 hover:bg-neutral-600 text-neutral-100 px-4 py-2">
          Save Lead
        </button>
      </div>
    </div>
  );
}
