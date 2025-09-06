"use client";

export default function EventList({ events }) {
  return (
    <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-3 text-green-400">Your Events</h2>
      {events && events.length > 0 ? (
        <ul className="space-y-2">
          {events.map((e, i) => (
            <li
              key={i}
              className="p-3 rounded bg-gray-700 text-gray-100 cursor-pointer hover:bg-gray-600"
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
