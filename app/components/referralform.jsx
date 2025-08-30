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
      // Build a compact note from fields
      const parts = [];
      parts.push(INDUSTRIES.find((i) => i.id === industry)?.label || industry);
      for (const f of fields) {
        const v = form[f.key];
        if (v !== undefined && v !== "") parts.push(`${f.label}: ${v}`);
      }
      if (form.headcount) parts.push(`Headcount: ${form.headcount}`);
      if (form.price_per_person) parts.push(`$${Number(form.price_per_person).toFixed(2)}/pp`);
      if (form.notes) parts.push(`Notes: ${form.notes}`);

      // 1) create lead
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

      // 2) create proposal (optional pricing)
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
      // Optional: jump into chat
      // window.location.href = `/chat/${lead.id}`;

      // Reset some fields
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
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl border rounded-2xl p-5 bg-white">
      {/* Top line */}
      <div className="grid md:grid-cols-3 gap-3">
        <input className="border rounded p-2" placeholder="Host (e.g., Anna)" value={form.host} onChange={(e) => setVal("host", e.target.value)} required />
        <input className="border rounded p-2" placeholder="Vendor" value={form.vendor} onChange={(e) => setVal("vendor", e.target.value)} />
        <input className="border rounded p-2" placeholder="Your name (referrer)" value={form.referrer} onChange={(e) => setVal("referrer", e.target.value)} />
      </div>

      {/* Industry */}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Industry</label>
        <select className="border rounded p-2" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          {INDUSTRIES.map((i) => (
            <option key={i.id} value={i.id}>{i.label}</option>
          ))}
        </select>
      </div>

      {/* Dynamic fields */}
      <IndustryFields industry={industry} form={form} setVal={setVal} />

      {/* Optional classic pricing visible for any industry */}
      <div className="grid md:grid-cols-2 gap-3 items-end">
        <input
          className="border rounded p-2"
          type="number"
          placeholder="Headcount (optional)"
          value={form.headcount}
          onChange={(e) => setVal("headcount", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3 items-end">
          <label className="text-sm">
            Price per person (optional)
            <input
              type="number"
              step="0.01"
              className="w-full border rounded p-2 mt-1"
              value={form.price_per_person}
              onChange={(e) => setVal("price_per_person", e.target.value)}
            />
          </label>
          <div className="text-right font-semibold">
            {subtotal > 0 ? `Subtotal: $${subtotal.toFixed(2)}` : `Subtotal: —`}
          </div>
        </div>
      </div>

      {/* Fee slider */}
      <div>
        <label className="text-sm font-semibold">Referral Fee: {form.referrer_fee_pct}%</label>
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
            Referrer earns ${referrerCut.toFixed(2)} • Vendor takes ${vendorTake.toFixed(2)}
          </div>
        )}
      </div>

      <textarea className="w-full border rounded p-2" placeholder="Notes" value={form.notes} onChange={(e) => setVal("notes", e.target.value)} />

      <button disabled={submitting} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
