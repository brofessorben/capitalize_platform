"use client";
import { useMemo, useState } from "react";
import IndustryFields, { INDUSTRIES, FIELDS_BY_INDUSTRY } from "./IndustryFields";

// Safe JSON helper
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  const body = ct.includes("application/json") && text ? JSON.parse(text) : { error: text || null };
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}

export default function ReferralForm() {
  const [industry, setIndustry] = useState("catering");
  const [form, setForm] = useState({
    host: "",
    vendor: "Roadhouse Grille",
    referrer: "Ben",
    notes: "",
    headcount: "",
    price_per_person: "",
    referrer_fee_pct: 11,
  });
  const [submitting, setSubmitting] = useState(false);

  const fields = FIELDS_BY_INDUSTRY[industry] || [];
  const subtotal = useMemo(() => {
    if (!form.headcount || !form.price_per_person) return 0;
    const s = Number(form.headcount) * Number(form.price_per_person);
    return Number.isFinite(s) ? s : 0;
  }, [form.headcount, form.price_per_person]);

  const referrerCut = subtotal ? (subtotal * Number(form.referrer_fee_pct || 0)) / 100 : 0;
  const vendorTake = subtotal ? subtotal - referrerCut : 0;

  function setVal(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parts = [];
      parts.push(INDUSTRIES.find((i) => i.id === industry)?.label || industry);
      for (const f of fields) {
        const v = form[f.key];
        if (v !== undefined && v !== "") parts.push(`${f.label}: ${v}`);
      }
      if (form.headcount) parts.push(`Headcount: ${form.headcount}`);
      if (form.price_per_person) parts.push(`$${Number(form.price_per_person).toFixed(2)}/pp`);
      if (form.notes) parts.push(`Notes: ${form.notes}`);

      const leadResp = await fetchJSON("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: form.host,
          vendor: form.vendor,
          referrer: form.referrer,
          notes: parts.join(" • "),
        }),
      });
      const lead = leadResp.lead;

      const terms = {
        industry,
        fields: Object.fromEntries(fields.map((f) => [f.key, form[f.key] ?? null])),
        headcount: form.headcount ? Number(form.headcount) : null,
        price_per_person: form.price_per_person ? Number(form.price_per_person) : null,
        subtotal: subtotal || null,
        referrer_fee_pct: Number(form.referrer_fee_pct),
        referrer_cut: subtotal ? Number(referrerCut.toFixed(2)) : null,
        vendor_take: subtotal ? Number(vendorTake.toFixed(2)) : null,
        currency: "USD",
        notes: form.notes || null,
      };

      await fetchJSON("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, vendor: form.vendor, terms, status: "draft" }),
      });

      alert("Lead + Proposal created!");
      setForm((f) => ({
        ...f,
        host: "",
        notes: "",
        headcount: "",
        price_per_person: "",
      }));
    } catch (err) {
      alert(err.message || "Submit error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-6 bg-white rounded-lg shadow-md space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Referral Details</h2>
        <div className="flex flex-col gap-4">
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Host (e.g., Anna)"
            value={form.host}
            onChange={(e) => setVal("host", e.target.value)}
            required
          />
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Vendor"
            value={form.vendor}
            onChange={(e) => setVal("vendor", e.target.value)}
          />
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your name (referrer)"
            value={form.referrer}
            onChange={(e) => setVal("referrer", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-semibold text-gray-700">Industry</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          {INDUSTRIES.map((i) => (
            <option key={i.id} value={i.id}>{i.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700">Industry-Specific Fields</h3>
        <IndustryFields industry={industry} form={form} setVal={setVal} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            type="number"
            placeholder="Headcount (optional)"
            value={form.headcount}
            onChange={(e) => setVal("headcount", e.target.value)}
          />
          <input
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            type="number"
            step="0.01"
            placeholder="Price per Person (optional)"
            value={form.price_per_person}
            onChange={(e) => setVal("price_per_person", e.target.value)}
          />
          <div className="text-right font-semibold text-gray-800">
            {subtotal > 0 ? `Subtotal: $${subtotal.toFixed(2)}` : `Subtotal: —`}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Referral Fee: {form.referrer_fee_pct}%</label>
        <input
          type="range"
          min="5"
          max="22"
          value={form.referrer_fee_pct}
          onChange={(e) => setVal("referrer_fee_pct", Number(e.target.value))}
          className="w-full"
        />
        {subtotal > 0 && (
          <div className="text-xs text-gray-600">
            Referrer earns: ${referrerCut.toFixed(2)} • Vendor takes: ${vendorTake.toFixed(2)}
          </div>
        )}
      </div>

      <textarea
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setVal("notes", e.target.value)}
      />

      <button
        disabled={submitting}
        className="w-full px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50 hover:bg-gray-800 transition-colors"
        type="submit"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
