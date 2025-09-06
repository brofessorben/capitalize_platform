"use client";

import { useRouter } from "next/navigation";

export default function EventList({ events = [] }) {
  const router = useRouter();

  return (
    <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-3 text-green-400">Your Events</h2>
      {events.length ? (
        <ul className="space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              onClick={() => router.push(`/chat/${encodeURIComponent(e.id)}`)}
              className="p-3 rounded bg-gray-700 text-gray-100 cursor-pointer hover:bg-gray-600"
              role="button"
            >
              <div className="font-semibold">{e.title}</div>
              <div className="text-sm text-gray-300">{e.date}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No events yet.</p>
      )}
    </div>
  );
}
