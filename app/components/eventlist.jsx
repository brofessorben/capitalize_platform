// app/components/eventlist.jsx
"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EventList({ roleFilter }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let sub;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setEvents((data || []).filter((e) => !roleFilter || e.role === roleFilter));
      setLoading(false);
    };
    load();

    // realtime on events table
    sub = supabase
      .channel("events-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .subscribe();

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, [roleFilter]);

  if (loading) return <div className="text-zinc-400 text-sm">Loading events…</div>;
  if (!events.length) return <div className="text-zinc-400 text-sm">No events yet.</div>;

  return (
    <div className="space-y-2">
      {events.map((e) => (
        <button
          key={e.id}
          onClick={() => router.push(`/chat/${e.id}`)}
          className="w-full text-left rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-3 hover:bg-zinc-900"
        >
          <div className="text-zinc-100 font-medium">{e.title}</div>
          <div className="text-xs text-zinc-400">{e.role} • {new Date(e.created_at).toLocaleString()}</div>
        </button>
      ))}
    </div>
  );
}
