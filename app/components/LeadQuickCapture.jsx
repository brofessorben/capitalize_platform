"use client";
import { useEffect, useState } from "react";

export default function LeadQuickCapture() {
  const [form, setForm] = useState({
    referrerName: "",
    referrerEmail: "",
    hostName: "",
    hostContact: "",
    vendorName: "",
    vendorContact: "",
    website: "",
    notes: "",
  });

  // listen for AI auto-fill
  useEffect(() => {
    function onAiFill(e) {
      const { email, phone, budget, headcount, date, website } = e.detail || {};
      setForm((prev) => ({
        ...prev,
        referrerEmail: email || prev.referrerEmail,
        hostContact: phone || prev.hostContact,
        website: website || prev.website,
        notes: [
          prev.notes?.trim(),
          [date && `Date: ${date}`, headcount && `Headcount: ${headcount}`, budget && `Budget: ${budget}`]
            .filter(Boolean)
            .join(" • "),
        ]
          .filter(Boolean)
          .join("\n"),
      }));
    }
    window.addEventListener("ai-fill-lead", onAiFill);
    return () => window.removeEventListener("ai-fill-lead", onAiFill);
  }, []);

  return (
    <div className="mt-6 p-4 rounded-xl bg-neutral-900 text-white space-y-3">
      <h3 className="font-semibold">Lead Quick Capture</h3>
      <input
        placeholder="Referrer — Name"
        className="w-full rounded-md bg-neutral-800 px-3 py-2"
        value={form.referrerName}
        onChange={(e) => setForm({ ...form, referrerName: e.target.value })}
      />
      <input
        placeholder="Referrer — Email"
        className="w-full rounded-md bg-neutral-800 px-3 py-2"
        value={form.referrerEmail}
        onChange={(e) => setForm({ ...form, referrerEmail: e.target.value })}
      />
      <input
        placeholder="Host — Name"
        className="w-full rounded-md bg-neutral-800 px-3 py-2"
        value={form.hostName}
        onChange={(e) => setForm({ ...form, hostName: e.target.value })}
      />
      <input
        placeholder="Host — Phone / Email"
        className="w-full rounded-md bg-neutral-800 px-3 py-2"
        value={form.hostContact}
        onChange={(e) => setForm({ ...form, hostContact: e.target.value })}
      />
      <input
        placeholder="Vendor — Name"
        className="w-full rounded-md bg-neutral-800 px-3 py-2"
        value={form.vendorName}
        onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
      />
      <input
        placeholder="Vendor — Phone / Email"
        className="w-full rounded-md bg-neutral-800 px-3 py-2"
        value={form.vendorContact}
        onChange={(e) => setForm({ ...form, vendorContact: e.target.value })}
      />
      <input
        placeholder="Website (optional)"
        className="w-full rounded-md bg-neutral-800 px-3 py-2"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      <textarea
        placeholder="Notes / Context — Budget, headcount, date, vibe…"
        className="w-full rounded-md bg-neutral-800 px-3 py-2 resize-none"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-md bg-emerald-600 text-white">Draft Intro</button>
        <button className="px-4 py-2 rounded-md bg-neutral-700 text-white">Save Lead</button>
      </div>
    </div>
  );
}
