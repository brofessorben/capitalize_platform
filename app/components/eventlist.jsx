"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnon);

/**
 * Props:
 * - role: "referrer" | "vendor" | "host"
 * - onSelect: (eventId: string) => void
 */
export default function EventList({ role = "referrer", onSelect }) {
  const [events, setEvents] = useState([]);
  const [working, setWorking] = useState(false);

  // load existing events for this user/role
  useEffect(() => {
    async function run() {
      // simple: show last 25 events regardless of owner for now
      // (match to your schema later if you filter by user)
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);
      if (!error && data) setEvents(data);
    }
    run();
  }, []);

  async function createNew() {
    try {
      setWorking(true);
      const r = await fetch("/api/events/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "failed to create event");

      const id = j?.event?.id;
      if (id) {
        setEvents((e) => [{ ...j.event }, ...e]);
        onSelect && onSelect(id);
      } else {
        throw new Error("No event.id returned from API");
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || "New Thread failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Threads</h3>
        <button
          type="button"
          onClick={createNew}
          disabled={working}
          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {working ? "Creating…" : "+ New Thread"}
        </button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm opacity-70">
          No threads yet. Make one!
        </div>
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="cursor-pointer px-4 py-3 hover:bg-white/5"
              onClick={() => onSelect && onSelect(ev.id)}
            >
              <div className="text-sm font-medium">Thread {ev.id}</div>
              <div className="text-xs opacity-60">
                {new Date(ev.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
