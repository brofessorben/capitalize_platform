// app/components/eventlist.jsx
"use client";

import React from "react";

export default function EventList({ items = [], selectedId, onSelect, onNew }) {
  return (
    <div className="mt-6 rounded-2xl border border-[#24322a] bg-[#0e1512]/60">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#24322a]">
        <h3 className="text-sm font-semibold text-[#c9fdd7] tracking-wide">Your Threads</h3>
        <button
          onClick={onNew}
          className="text-xs rounded-md px-3 py-1 border border-[#2b4b3a] bg-[#0f1a14] text-[#baf7ca] hover:bg-[#143021] transition"
        >
          + New Thread
        </button>
      </div>

      <ul className="divide-y divide-[#24322a]">
        {items.length === 0 && (
          <li className="px-4 py-4 text-sm text-[#9ccbb0]">No threads yet. Make one!</li>
        )}
        {items.map((e) => (
          <li key={e.id}>
            <button
              onClick={() => onSelect?.(e.id)}
              className={`w-full text-left px-4 py-3 transition ${
                selectedId === e.id
                  ? "bg-[#13231b] text-[#d8ffe6]"
                  : "hover:bg-[#101713] text-[#c2e9d2]"
              }`}
            >
              <div className="text-sm font-medium truncate">{e.title}</div>
              <div className="text-xs text-[#8fbfa5]">
                {new Date(e.updated_at || e.created_at).toLocaleString()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
