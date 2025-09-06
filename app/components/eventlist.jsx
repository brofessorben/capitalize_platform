"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function EventList({ role = "referrer", onSelect }) {
  const supabase = getSupabase();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let off = false;
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("role", role)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (!off) setRows(data || []);
    };
    load();

    const ch = supabase
      .channel(`events-${role}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `role=eq.${role}` },
        load
      )
      .subscribe();

    return () => {
      off = true;
      supabase.removeChannel(ch);
    };
  }, [role, supabase]);

  async function newThread() {
    const r = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Thread", role }),
    });
    const j = await r.json();
    onSelect?.(j?.id);
  }

  return (
    <div className="rounded-xl border border-[#203227] bg-[#0b0f0d]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-[#cdebd9] font-semibold">Your Threads</div>
        <button
          className="rounded-md bg-[#103221] border border-[#1f3b2d] px-3 py-1 text-[#c9fdd7] hover:bg-[#143021]"
          onClick={newThread}
        >
          + New Thread
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 pb-4 text-sm text-slate-400">No threads yet. Make one!</div>
      ) : (
        <ul className="px-2 pb-3 space-y-1">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onSelect?.(r.id)}
                className="w-full text-left rounded-md px-3 py-2 hover:bg-[#0f1a14] border border-transparent hover:border-[#1f3b2d] text-[#d7efe2]"
                title={r.title}
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
