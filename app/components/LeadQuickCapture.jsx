// app/components/LeadQuickCapture.jsx
"use client";

export default function LeadQuickCapture({
  value = {},                // <-- defensive default
  onChange = () => {},
  onDraftIntro = () => {},
}) {
  const v = {
    referrerName: value.referrerName || "",
    referrerEmail: value.referrerEmail || "",
    hostName: value.hostName || "",
    hostContact: value.hostContact || "",
    vendorName: value.vendorName || "",
    vendorContact: value.vendorContact || "",
    website: value.website || "",
    notes: value.notes || "",
  };

  function setField(k, val) {
    onChange({ ...v, [k]: val });
  }

  return (
    <div className="rounded-2xl bg-neutral-900/70 p-4 shadow-lg ring-1 ring-white/10">
      <h3 className="text-lg font-semibold text-neutral-200 mb-4">Lead Quick Capture</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <Input label="Referrer — Name"   value={v.referrerName}  onChange={(t)=>setField("referrerName", t)} />
        <Input label="Referrer — Email"  value={v.referrerEmail} onChange={(t)=>setField("referrerEmail", t)} />
        <Input label="Host — Name"       value={v.hostName}      onChange={(t)=>setField("hostName", t)} />
        <Input label="Host — Phone / Email" value={v.hostContact} onChange={(t)=>setField("hostContact", t)} />
        <Input label="Vendor — Name"     value={v.vendorName}    onChange={(t)=>setField("vendorName", t)} />
        <Input label="Vendor — Phone / Email" value={v.vendorContact} onChange={(t)=>setField("vendorContact", t)} />
        <div className="md:col-span-2">
          <Input label="Website (optional)" value={v.website} onChange={(t)=>setField("website", t)} />
        </div>
        <div className="md:col-span-2">
          <Textarea
            label="Notes / Context"
            placeholder="Budget, headcount, date, dietary, vibe…"
            value={v.notes}
            onChange={(t)=>setField("notes", t)}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          className="rounded-xl bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 transition-colors"
          onClick={onDraftIntro}
        >
          Draft Intro
        </button>
        <button
          className="rounded-xl bg-neutral-700 px-4 py-2 font-medium hover:bg-neutral-600 transition-colors"
          onClick={() => console.log("Save lead clicked", v)}
        >
          Save Lead
        </button>
      </div>
    </div>
  );
}

function Input({ label, value = "", onChange, placeholder = "" }) {
  return (
    <label className="block">
      <div className="text-sm text-neutral-300 mb-1">{label}</div>
      <input
        className="w-full rounded-xl bg-neutral-800 text-neutral-100 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/70 placeholder:text-neutral-400"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}

function Textarea({ label, value = "", onChange, placeholder = "" }) {
  return (
    <label className="block">
      <div className="text-sm text-neutral-300 mb-1">{label}</div>
      <textarea
        rows={4}
        className="w-full rounded-xl bg-neutral-800 text-neutral-100 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500/70 placeholder:text-neutral-400 resize-y"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}
