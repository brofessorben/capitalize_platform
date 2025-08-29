// pages/index.js (copied in by workflow)
import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({ host: "", vendor: "", referrer: "", notes: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setResult(null);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Failed");
      setResult(data.referral);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0b0b", color: "white", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "#151515", borderRadius: 16, padding: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.4)" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: 0.5 }}>CAPITALIZE</h1>
        <p style={{ opacity: 0.8, marginTop: 8 }}>Submit a referral (demo)</p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <input placeholder="Host name" value={form.host} onChange={e=>set("host", e.target.value)} required minLength={2} style={inp}/>
          <input placeholder="Vendor name" value={form.vendor} onChange={e=>set("vendor", e.target.value)} required minLength={2} style={inp}/>
          <input placeholder="Referrer email" type="email" value={form.referrer} onChange={e=>set("referrer", e.target.value)} required style={inp}/>
          <textarea placeholder="Notes (optional)" value={form.notes} onChange={e=>set("notes", e.target.value)} rows={3} style={{...inp, resize:"vertical"}} />
          <button disabled={loading} style={btn}>{loading ? "Submitting..." : "Submit Referral"}</button>
        </form>

        {err && <p style={{ color: "#ff6b6b", marginTop: 12 }}>Error: {err}</p>}
        {result && (
          <pre style={{ marginTop: 12, background: "#0f0f0f", padding: 12, borderRadius: 8, overflowX: "auto" }}>
