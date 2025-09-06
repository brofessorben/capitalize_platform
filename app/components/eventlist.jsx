"use client";
import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function EventList({ role, onOpen }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const supabase = getSupabase();
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false });
      setEvents(data || []);
    };
    load();
  }, [role]);

  return (
    <div className="mt-6 space-y-2">
      {events.map((e) => (
        <button
          key={e.id}
          onClick={() => onOpen?.(e)}
          className="w-full text-left bg-neutral-900/60 hover:bg-neutral-800 rounded-xl px-4 py-3 border border-neutral-700"
        >
          <div className="font-semibold">{e.title}</div>
          <div className="text-xs text-neutral-400">{e.status}</div>
        </button>
      ))}
    </div>
  );
}
