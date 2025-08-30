"use client";
import { useEffect, useState } from "react";

export default function ReferrerDash() {
  const [form, setForm] = useState({ host: "", vendor: "", referrer: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [leads, setLeads] = useState([]);

  async function loadLeads() {
    const r = await fetch("/api/leads");
    const d = await r.json();
    setLeads(d.leads || []);
  }

  useEffect(() => { loadLeads(); }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setOk(""); setLoading(true);
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setOk("Lead submitted ✅");
      setForm({ host: "", vendor: "", referrer: "", notes: "" });
      await loadLeads();
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Referrer Dashboard</h1>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Leads Submitted" value={leads.length} />
        <KPI label="Booked" value={leads.filter(l => l.status === "booked").length} />
        <KPI label="Pending" value={leads.filter(l => l.status === "pending").length} />
        <KPI label="Earnings" value="$0.00" />
      </div>

      {/* Submit Lead */}
      <form onSubmit={submit} className="space-y-3 max-w-xl border rounded-2xl p-4">
        <h2 className="font-semibold">Submit a Referral</h2>
        <input className="w-full border rounded p-2" placeholder="Host (e.g., Anna)"
               value={form.host} onChange={e=>setForm({...form, host: e.target.value})}/>
        <input className="w-full border rounded p-2" placeholder="Vendor (e.g., Roadhouse Grille)"
               value={form.vendor} onChange={e=>setForm({...form, vendor: e.target.value})}/>
        <input className="w-full border rounded p-2" placeholder="Your name (referrer)"
               value={form.referrer} onChange={e=>setForm({...form, referrer: e.target.value})}/>
        <textarea className="w-full border rounded p-2" placeholder="Notes"
                  value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/>
        <button disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white">
          {loading ? "Submitting..." : "Submit"}
        </button>
        {ok && <div className="text-green-600 text-sm">{ok}</div>}
        {err && <div className="text-red-600 text-sm">{err}</div>}
      </form>

      {/* Leads list */}
      <section className="space-y-3">
        <h2 className="font-semibold">Recent Leads</h2>
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Created</Th><Th>Host</Th><Th>Vendor</Th><Th>Referrer</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t">
                  <Td>{new Date(l.created_at).toLocaleString()}</Td>
                  <Td>{l.host}</Td>
                  <Td>{l.vendor}</Td>
                  <Td>{l.referrer}</Td>
                  <Td>{l.status}</Td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td className="p-3 text-gray-500" colSpan={5}>No leads yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
function Th({ children }) { return <th className="text-left p-3 font-semibold">{children}</th>; }
function Td({ children }) { return <td className="p-3 align-top">{children}</td>; }
