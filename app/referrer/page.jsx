"use client";
import { useMemo, useState } from "react";

/** -------- Industry definitions (tweak anytime) -------- */
const INDUSTRIES = [
  { id: "catering", label: "Food & Catering" },
  { id: "real_estate", label: "Real Estate" },
  { id: "events", label: "Events & Venues" },
  { id: "automotive", label: "Automotive" },
  { id: "home_services", label: "Home Services" },
  { id: "gigs", label: "Gigs & Talent" },
  { id: "beauty", label: "Beauty & Wellness" },
  { id: "other", label: "Other" },
];

// Field blueprints per industry
const FIELDS_BY_INDUSTRY = {
  catering: [
    { key: "event_type", label: "Event Type", type: "select", options: ["Wedding", "Corporate Lunch", "Birthday", "Graduation", "Festival", "Other"] },
    { key: "headcount", label: "Headcount (optional)", type: "number" },
    { key: "price_per_person", label: "Price per person (optional)", type: "number", step: "0.01" },
  ],
  real_estate: [
    { key: "property_address", label: "Property Address", type: "text", required: true },
    { key: "target_date", label: "Target Date (optional)", type: "date" },
    { key: "budget", label: "Budget (optional)", type: "number", step: "0.01" },
  ],
  events: [
    { key: "event_type", label: "Event Type", type: "select", options: ["Conference", "Concert", "Meetup", "Wedding", "Other"] },
    { key: "attendees", label: "Estimated Attendees (optional)", type: "number" },
    { key: "date", label: "Date (optional)", type: "date" },
  ],
  automotive: [
    { key: "vehicle", label: "Vehicle (Year/Make/Model)", type: "text", required: true },
    { key: "service_needed", label: "Service Needed", type: "text", required: true },
    { key: "budget", label: "Budget (optional)", type: "number", step: "0.01" },
  ],
  home_services: [
    { key: "service_needed", label: "Service Needed", type: "text", required: true },
    { key: "address", label: "Address (optional)", type: "text" },
    { key: "budget", label: "Budget (optional)", type: "number", step: "0.01" },
  ],
  gigs: [
    { key: "talent_type", label: "Talent Type", type: "text", required: true },
    { key: "date", label: "Date (optional)", type: "date" },
    { key: "rate", label: "Rate (optional)", type: "number", step: "0.01" },
  ],
  beauty: [
    { key: "service_needed", label: "Service Needed", type: "text", required: true },
    { key: "date", label: "Date (optional)", type: "date" },
    { key: "budget", label: "Budget (optional)", type: "number", step: "0.01" },
  ],
  other: [
    { key: "need", label: "What’s needed?", type: "text", required: true },
    { key: "date", label: "Date (optional)", type: "date" },
    { key: "budget", label: "Budget (optional)", type: "number", step: "0.01" },
  ],
};

/** -------- Utility: safe JSON fetch with useful errors -------- */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  const maybeJSON = ct.includes("application/json");
  const body = maybeJSON && text ? JSON.parse(text) : { error: text?.slice(0, 200) || null };

  if (!res.ok) {
    const msg = body?.error || `HTTP ${res.status}`;
    throw new Error(`${msg}`);
  }
  return body;
}

/** ------------------- Component ------------------- */
export default function ReferrerDash() {
  const [industry, setIndustry] = useState("catering");
  const [form, setForm] = useState({
    host: "",
    vendor: "Roadhouse Grille",
    referrer: "Ben",
    notes: "",
    // generic optional pricing primitives (used when present)
    headcount: "",
    price_per_person: "",
    referrer_fee_pct: 11,
    // dynamic fields will be added as keys on demand
  });
  const [submitting, setSubmitting] = useState(false);

  const fields = FIELDS_BY_INDUSTRY[industry] || [];
  const subtotal = useMemo(() => {
    // only compute for classic “per person” flows
    if (!form.headcount || !form.price_per_person) return 0;
    const s = Number(form.headcount) * Number(form.price_per_person);
    return Number.isFinite(s) ? s : 0;
  }, [form.headcount, form.price_per_person]);

  const referrerCut = subtotal ? (subtotal * Number(form.referrer_fee_pct || 0)) / 100 : 0;
  const vendorTake = subtotal ? subtotal - referrerCut : 0;

  function setVal(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submitLead(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Build a compact “context note” based on industry-specific fields
      const parts = [];
      parts.push(INDUSTRIES.find((i) => i.id === industry)?.label || industry);

      for (const f of fields) {
        const v = form[f.key];
        if (v !== undefined && v !== "") {
          parts.push(`${f.label}: ${v}`);
        }
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

      // 2) create proposal (pricing optional)
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
      // reset minimal fields
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Referrer Dashboard</h1>

      <form onSubmit={submitLead} className="space-y-4 max-w-2xl border rounded-2xl p-5 bg-white">
        {/* Top line: Host/Vendor/Referrer */}
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
        <div className="grid md:grid-cols-2 gap-3">
          {fields.map((f) =>
            f.type === "select" ? (
              <select
                key={f.key}
                className="border rounded p-2"
                value={form[f.key] ?? (f.options?.[0] || "")}
                onChange={(e) => setVal(f.key, e.target.value)}
                required={!!f.required}
              >
                {(f.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                key={f.key}
                className="border rounded p-2"
                type={f.type}
                step={f.step}
                placeholder={f.label}
                value={form[f.key] ?? ""}
                onChange={(e) => setVal(f.key, e.target.value)}
                required={!!f.required}
              />
            )
          )}
        </div>

        {/* Optional classic pricing (visible for any industry, ignored if empty) */}
        <div className="grid md:grid-cols-2 gap-3 items-end">
          <input className="border rounded p-2" type="number" placeholder="Headcount (optional)" value={form.headcount} onChange={(e) => setVal("headcount", e.target.value)} />
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
    </div>
  );
}
