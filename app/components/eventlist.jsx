"use client";

import { useEffect, useState } from "react";

export default function EventList({ role = "referrer", activeId, onSelect }) {
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/events?role=${role}`);
    const { events } = await res.json();
    setEvents(events || []);
  }

  useEffect(() => { load(); }, [role]);

  async function createQuick() {
    const title = prompt("Event title (e.g., 'Q3 Partner Mixer, 10/18'):");
    if (!title) return;
    setBusy(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, title, meta: {} }),
      });
      const { event, error } = await res.json();
      if (error) alert(error);
      else {
        setEvents((e) => [event, ...e]);
        onSelect?.(event.id);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-white uppercase tracking-wide">
          {role} events
        </div>
        <button
          onClick={createQuick}
          disabled={busy}
          className="text-xs px-3 py-1 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
        >
          + New
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-neutral-400 text-sm">No events yet. Create your first.</div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onSelect?.(e.id)}
                className={`w-full text-left px-3 py-2 rounded-lg border ${
                  activeId === e.id
                    ? "bg-neutral-800 border-emerald-600 text-white"
                    : "bg-neutral-950 border-neutral-800 text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                <div className="text-sm font-medium">{e.title}</div>
                <div className="text-xs text-neutral-400">
                  {new Date(e.created_at).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
