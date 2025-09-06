"use client";
import React from "react";

export default function EventList({ items = [], activeId, onSelect, onNew }) {
  return (
    <div className="mt-4 rounded-md border border-[#203227] bg-[#0b0f0d]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#203227]">
        <span className="font-medium text-[#cdebd9]">Your Threads</span>
        <button
          onClick={onNew}
          className="rounded-md bg-[#163626] hover:bg-[#1b4431] px-2.5 py-1 text-sm"
        >
          + New Thread
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-3 py-3 text-sm text-[#9ccbb4]">No threads yet. Make one!</div>
      ) : (
        <ul className="divide-y divide-[#1b2a22]">
          {items.map((ev) => (
            <li key={ev.id}>
              <button
                onClick={() => onSelect?.(ev)}
                className={`w-full text-left px-3 py-2 hover:bg-[#0e1512] ${
                  activeId === ev.id ? "bg-[#101a16]" : ""
                }`}
              >
                <div className="text-[#d5f5e6]">{ev.title}</div>
                <div className="text-xs text-[#8fbfaa]">
                  {ev.status ?? "open"} • {new Date(ev.updated_at || ev.created_at).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
