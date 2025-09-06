// app/components/eventlist.jsx
"use client";
import React from "react";

export default function EventList({ threads = [], selectedId, onSelect, onNew }) {
  return (
    <div className="mt-8 rounded-xl border border-[#233] bg-[#0f1412]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="font-semibold text-[#c9fdd7]">Your Threads</div>
        <button
          onClick={onNew}
          className="rounded-md bg-[#14452f] px-3 py-1 text-sm font-medium text-[#c9fdd7] hover:bg-[#1b5a3d]"
        >
          + New Thread
        </button>
      </div>

      <div className="border-t border-[#1b2a24]" />

      {threads.length === 0 ? (
        <div className="p-4 text-sm text-[#9fb8ac]">No threads yet. Make one!</div>
      ) : (
        <ul className="p-2">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => onSelect?.(t)}
                className={`w-full rounded-lg px-3 py-2 text-left transition ${
                  selectedId === t.id
                    ? "bg-[#173426] text-[#d7ffe6] border border-[#23513b]"
                    : "bg-transparent text-[#bfead1] hover:bg-[#13271e]"
                }`}
              >
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs opacity-70 mt-0.5">
                  {t.role} • {t.status}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
