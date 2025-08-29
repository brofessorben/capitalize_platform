// pages/index.js (copied by workflow) — clean layout, no funky formatting
import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    host: "",
    vendor: "",
    referrer: "",
    notes: "",
  });
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Submission failed");
      setResult(data.referral);
      setForm({ host: "", vendor: "", referrer: "", notes: "" });
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>CAPITALIZE</div>
        <h1 style={styles.h1}>Submit a Referral</h1>
        <p style={styles.sub}>Connect a host with a vendor and see the validated result instantly.</p>

        <form onSubmit={submit} style={styles.form}>
          <Field
            label="Host name"
            value={form.host}
            onChange={(v) => setField("host", v)}
            placeholder="e.g., Anna Smith"
            required
            minLength={2}
          />
          <Field
            label="Vendor name"
            value={form.vendor}
            onChange={(v) => setField("vendor", v)}
            placeholder="e.g., Roadhouse Grille"
            required
            minLength={2}
          />
          <Field
            label="Referrer email"
            type="email"
            value={form.referrer}
            onChange={(v) => setField("referrer", v)}
            placeholder="you@example.com"
            required
          />
          <Field
            label="Notes (optional)"
            multiline
            value={form.notes}
            onChange={(v) => setField("notes", v)}
            placeholder="Short context for this referral…"
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Submitting…" : "Submit Referral"}
          </button>
        </form>

        {err ? <p style={styles.error}>Error: {err}</p> : null}

        {result ? (
          <div style={styles.resultBox}>
            <div style={styles.resultTitle}>Referral created</div>
            <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : null}

        <div style={styles.footer}>Powered by <code>/api/referrals</code></div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  ...rest
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{ ...styles.input, minHeight: 96, resize: "vertical" }}
          {...rest}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={styles.input}
          {...rest}
        />
      )}
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    backgroundColor: "#0b0b0b",
    color: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: 640,
    backgroundColor: "#141414",
    border: "1px solid #232323",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 32px rgba(0,0,0,0.5)",
  },
  logo: {
    display: "inline-block",
    fontSize: 11,
    letterSpacing: 1.2,
    color: "#9ae6b4",
    border: "1px solid rgba(154,230,180,0.25)",
    background: "rgba(154,230,180,0.12)",
    padding: "4px 8px",
    borderRadius: 999,
  },
  h1: { margin: "10px 0 4px 0", fontSize: 26, lineHeight: 1.1 },
  sub: { margin: 0, opacity: 0.75, fontSize: 14 },
  form: { display: "grid", gap: 12, marginTop: 16 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 13, opacity: 0.85 },
  input: {
    background: "#0e0e0e",
    color: "#fff",
    border: "1px solid #222",
    borderRadius: 10,
    padding: "12px",
    outline: "none",
  },
  button: {
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    fontWeight: 800,
    letterSpacing: 0.2,
    cursor: "pointer",
  },
  error: { color: "#ff8a8a", marginTop: 8, fontSize: 14 },
  resultBox: {
    marginTop: 12,
    background: "#0e0e0e",
    border: "1px solid #1f1f1f",
    borderRadius: 12,
    overflow: "hidden",
  },
  resultTitle: {
    padding: "10px 12px",
    borderBottom: "1px solid #1f1f1f",
    background: "#121212",
    fontWeight: 700,
  },
  pre: { margin: 0, padding: 12, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12.5 },
  footer: { marginTop: 14, opacity: 0.65, fontSize: 12, textAlign: "right" },
};
