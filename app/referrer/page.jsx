"use client";
import { useState } from "react";

const EVENT_TYPES = ["Wedding", "Corporate Lunch", "Birthday", "Graduation", "Festival", "Other"];

export default function ReferrerDash() {
  const [form, setForm] = useState({
    host: "",
    vendor: "Roadhouse Grille",
    referrer: "Ben",
    notes: "",
    event_type: "Wedding",
    headcount: "",
    price_per_person: "",
    referrer_fee_pct: 11, // default baseline
  });
  const [submitting, setSubmitting] = useState(false);

  const subtotal = form.headcount && form.price_per_person
    ? Number(form.headcount) * Number(form.price_per_person)
    : 0;
  const referrerCut = subtotal ? (subtotal * form.referrer_fee_pct) / 100 : 0;
  const vendorTake = subtotal ? subtotal - referrerCut : 0;

  async function submitLead(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const leadRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: form.host,
          vendor: form.vendor,
          referrer: form.referrer,
          notes: `${form.event_type} • ${form.headcount || "?"} ppl • ${form.notes}`.trim(),
        }),
      });
      const leadData = await leadRes.json();
      if (!leadRes.ok) throw new Error(leadData?.error || "Lead error");
      const lead = leadData.lead;

      const terms = {
        event_type: form.event_type,
        headcount: form.headcount ? Number(form.headcount) : null,
        price_per_person: form.price_per_person ? Number(form.price_per_person) : null,
        subtotal: subtotal || null,
        referrer_fee_pct: form.referrer_fee_pct,
        referrer_cut: referrerCut || null,
        vendor_take: vendorTake || null,
        notes: form.notes,
      };

      const propRes = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          vendor: form.vendor,
          terms,
          status: "draft",
        }),
      });
      const propData = await propRes.json();
      if (!propRes.ok) throw new Error(propData?.error || "Proposal error");

      alert("Lead + Proposal created!");
      setForm((f) => ({ ...f, host: "", notes: "" }));
    } catch (err) {
      alert(err.message || "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Referrer Dashboard</h1>

      <form onSubmit={submitLead} className="space-y-3 max-w-xl border rounded-2xl p-4">
        <h2 className="font-semibold">Submit a Referral</h2>

        <input className="w-full border rounded p-2" placeholder="Host (e.g., Anna)"
          value={form.host} onChange={(e)=>setForm({...form,host:e.target.value})} required/>

        <select className="border rounded p-2 w-full"
          value={form.event_type} onChange={(e)=>setForm({...form,event_type:e.target.value})}>
          {EVENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="Headcount (optional)" type="number"
            value={form.headcount} onChange={(e)=>setForm({...form,headcount:e.target.value})}/>
          <input className="border rounded p-2" placeholder="Price per person (optional)" type="number" step="0.01"
            value={form.price_per_person} onChange={(e)=>setForm({...form,price_per_person:e.target.value})}/>
        </div>

        <div>
          <label className="text-sm font-semibold">Referral Fee: {form.referrer_fee_pct}%</label>
          <input type="range" min="5" max="22" value={form.referrer_fee_pct}
            onChange={(e)=>setForm({...form,referrer_fee_pct:Number(e.target.value)})}
            className="w-full"/>
          {subtotal > 0 && (
            <div className="text-xs text-gray-600">
              Referrer earns ${referrerCut.toFixed(2)} • Vendor takes ${vendorTake.toFixed(2)}
            </div>
          )}
        </div>

        <textarea className="w-full border rounded p-2" placeholder="Notes"
          value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/>

        <button disabled={submitting}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
