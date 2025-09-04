"use client";
import React from "react";

export default function LeadQuickCapture({ formData, setFormData, onDraft }) {
  const update = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="mt-8 rounded-2xl bg-[#141414] border border-white/10 p-4">
      <h3 className="text-white/90 font-semibold mb-4">Lead Quick Capture</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="input" placeholder="Referrer — Name" value={formData.referrerName || ""} onChange={update("referrerName")} />
        <input className="input" placeholder="Referrer — Email" value={formData.referrerEmail || ""} onChange={update("referrerEmail")} />

        <input className="input" placeholder="Host — Name" value={formData.hostName || ""} onChange={update("hostName")} />
        <input className="input" placeholder="Host — Phone / Email" value={formData.hostContact || ""} onChange={update("hostContact")} />

        <input className="input" placeholder="Vendor — Name" value={formData.vendorName || ""} onChange={update("vendorName")} />
        <input className="input" placeholder="Vendor — Phone / Email" value={formData.vendorContact || ""} onChange={update("vendorContact")} />

        <input className="input md:col-span-2" placeholder="Website (optional)" value={formData.website || ""} onChange={update("website")} />
      </div>

      <textarea
        className="input mt-3"
        rows={4}
        placeholder="Notes / Context — Budget, headcount, date, dietary, vibe…"
        value={formData.notes || ""}
        onChange={update("notes")}
      />

      <div className="flex gap-3 mt-4">
        <button className="btn-primary" onClick={onDraft}>Draft Intro</button>
        <button className="btn-secondary">Save Lead</button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: #1d1d1d;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px;
          color: #e5e7eb;
          outline: none;
        }
        .input::placeholder { color: #9ca3af; }
        .btn-primary {
          background: #22c55e;
          color: #07210f;
          border-radius: 12px;
          padding: 10px 16px;
          font-weight: 600;
        }
        .btn-secondary {
          background: #303030;
          color: #e5e7eb;
          border-radius: 12px;
          padding: 10px 16px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
