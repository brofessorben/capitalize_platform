"use client";

import React, { useState } from "react";

export default function LeadQuickCapture() {
  const [form, setForm] = useState({
    // Referrer
    ref_name: "", ref_email: "", ref_phone: "",
    // Host
    host_name: "", host_email: "", host_phone: "",
    // Vendor
    vendor_name: "", vendor_email: "", vendor_phone: "",
    // Misc
    website: "", notes: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const draftIntro = () => {
    // TODO: wire to your AI call
    console.log("Draft Intro →", form);
  };

  const saveLead = async () => {
    // TODO: save to Supabase if you want this persisted
    console.log("Save Lead →", form);
  };

  const inputCls =
    "w-full rounded-md bg-[#0e1720] border border-[#213345] px-3 py-2 text-white placeholder-slate-400";

  return (
    <div className="rounded-xl border border-[#203227] bg-[#0b0f0d] p-4">
      <div className="mb-3 text-lg font-semibold text-[#cdebd9]">
        Lead Quick Capture
      </div>

      {/* Referrer Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input
          className={inputCls}
          placeholder="Referrer — Name"
          value={form.ref_name}
          onChange={set("ref_name")}
        />
        <input
          className={inputCls}
          placeholder="Referrer — Email"
          value={form.ref_email}
          onChange={set("ref_email")}
        />
        <input
          className={inputCls}
          placeholder="Referrer — Phone"
          value={form.ref_phone}
          onChange={set("ref_phone")}
        />
      </div>

      {/* Host Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input
          className={inputCls}
          placeholder="Host — Name"
          value={form.host_name}
          onChange={set("host_name")}
        />
        <input
          className={inputCls}
          placeholder="Host — Email"
          value={form.host_email}
          onChange={set("host_email")}
        />
        <input
          className={inputCls}
          placeholder="Host — Phone"
          value={form.host_phone}
          onChange={set("host_phone")}
        />
      </div>

      {/* Vendor Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input
          className={inputCls}
          placeholder="Vendor — Name"
          value={form.vendor_name}
          onChange={set("vendor_name")}
        />
        <input
          className={inputCls}
          placeholder="Vendor — Email"
          value={form.vendor_email}
          onChange={set("vendor_email")}
        />
        <input
          className={inputCls}
          placeholder="Vendor — Phone"
          value={form.vendor_phone}
          onChange={set("vendor_phone")}
        />
      </div>

      {/* Website (optional) */}
      <div className="mb-3">
        <input
          className={inputCls}
          placeholder="Website (optional)"
          value={form.website}
          onChange={set("website")}
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <textarea
          className={`${inputCls} min-h-[88px]`}
          placeholder="Notes / Context — Budget, headcount, date, vibe…"
          value={form.notes}
          onChange={set("notes")}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={draftIntro}
          className="flex-1 rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-semibold text-white"
        >
          Draft Intro
        </button>
        <button
          onClick={saveLead}
          className="flex-1 rounded-md bg-[#2a5bff] hover:bg-[#2048cc] px-4 py-2 font-semibold text-white"
        >
          Save Lead
        </button>
      </div>
    </div>
  );
}
