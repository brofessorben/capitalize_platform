"use client";
import { useState } from "react";

export default function ReferrerDash() {
  const [form, setForm] = useState({ host:"", vendor:"", referrer:"", notes:"" });
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Referrer Dashboard</h1>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Leads Submitted" value="0" />
        <KPI label="Booked" value="0" />
        <KPI label="Pending" value="0" />
        <KPI label="Earnings" value="$0.00" />
      </div>

      {/* Lead form (simple) */}
      <form
        onSubmit={(e)=>{ e.preventDefault(); alert("Submit lead (wire to /api/referrals)"); }}
        className="space-y-3 max-w-xl border rounded-2xl p-4"
      >
        <h2 className="font-semibold">Submit a Referral</h2>
        <input className="w-full border rounded p-2" placeholder="Host (e.g., Anna)" value={form.host} onChange={e=>setForm({...form,host:e.target.value})}/>
        <input className="w-full border rounded p-2" placeholder="Vendor (e.g., Roadhouse Grille)" value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})}/>
        <input className="w-full border rounded p-2" placeholder="Your name (referrer)" value={form.referrer} onChange={e=>setForm({...form,referrer:e.target.value})}/>
        <textarea className="w-full border rounded p-2" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <button className="px-4 py-2 rounded-xl bg-black text-white">Submit</button>
      </form>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
