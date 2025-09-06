"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function EventList({ role }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const supabase = getSupabase();

    const loadEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data || []);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="p-4 bg-[#111] text-white border-t border-gray-700">
      <h3 className="font-semibold mb-2">Your {role} Events</h3>
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm">No events yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((evt) => (
            <li
              key={evt.id}
              className="bg-gray-800 p-3 rounded hover:bg-gray-700 cursor-pointer"
            >
              <strong>{evt.title}</strong> — {evt.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
