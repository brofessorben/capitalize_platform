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
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState(null);

  // Load most recent events (you can scope by owner later)
  useEffect(() => {
    async function run() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setEvents(data);
    }
    run();
  }, []);

  async function createNew() {
    try {
      setCreating(true);
      const { data, error } = await supabase
        .from("events")
        .insert([{ title: "New Thread", role }])
        .select()
        .single();
      if (error) throw error;
      // Put it at the top and activate it
      setEvents((prev) => [data, ...prev]);
      setActive(data.id);
      onSelect && onSelect(data.id);
    } catch (e) {
      console.error(e);
      alert(e?.message || "New Thread failed");
    } finally {
      setCreating(false);
    }
  }

  function activate(id) {
    setActive(id);
    onSelect && onSelect(id);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Threads</h3>
        <button
          type="button"
          onClick={createNew}
          disabled={creating}
          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {creating ? "Creating…" : "+ New Thread"}
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
              className={`cursor-pointer px-4 py-3 hover:bg-white/5 ${
                active === ev.id ? "bg-white/10" : ""
              }`}
              onClick={() => activate(ev.id)}
            >
              <div className="text-sm font-medium">
                {ev.title || "Thread"} • {new Date(ev.created_at).toLocaleString()}
              </div>
              <div className="text-xs opacity-60">ID: {ev.id}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
