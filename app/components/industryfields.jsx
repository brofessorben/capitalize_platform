"use client";

export const INDUSTRIES = [
  { id: "catering", label: "Food & Catering" },
  { id: "real_estate", label: "Real Estate" },
  { id: "events", label: "Events & Venues" },
  { id: "automotive", label: "Automotive" },
  { id: "home_services", label: "Home Services" },
  { id: "gigs", label: "Gigs & Talent" },
  { id: "beauty", label: "Beauty & Wellness" },
  { id: "other", label: "Other" },
];

export const FIELDS_BY_INDUSTRY = {
  catering: [
    { key: "event_type", label: "Event Type", type: "select", options: ["Wedding", "Corporate Lunch", "Birthday", "Graduation", "Festival", "Other"] },
    { key: "headcount", label: "Headcount (optional)", type: "number" },
    { key: "price_per_person", label: "Price per Person (optional)", type: "number", step: "0.01" },
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

export default function IndustryFields({ industry, form, setVal }) {
  const fields = FIELDS_BY_INDUSTRY[industry] || [];
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-md">
      {fields.map((f) => (
        <div key={f.key} className="w-full">
          {f.type === "select" ? (
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              type={f.type}
              step={f.step}
              placeholder={f.label}
              value={form[f.key] ?? ""}
              onChange={(e) => setVal(f.key, e.target.value)}
              required={!!f.required}
            />
          )}
          <label className="block text-sm text-gray-500 mt-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
        </div>
      ))}
    </div>
  );
}
