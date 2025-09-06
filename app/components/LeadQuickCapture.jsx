"use client";

export default function LeadQuickCapture() {
  return (
    <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-3 text-green-400">Lead Quick Capture</h2>
      <form className="grid gap-2">
        <input placeholder="Referrer — Name" className="p-2 rounded bg-gray-700 border border-gray-600" />
        <input placeholder="Referrer — Email" className="p-2 rounded bg-gray-700 border border-gray-600" />
        <input placeholder="Host — Name" className="p-2 rounded bg-gray-700 border border-gray-600" />
        <input placeholder="Host — Phone / Email" className="p-2 rounded bg-gray-700 border border-gray-600" />
        <input placeholder="Vendor — Name" className="p-2 rounded bg-gray-700 border border-gray-600" />
        <input placeholder="Vendor — Phone / Email" className="p-2 rounded bg-gray-700 border border-gray-600" />
        <input placeholder="Website (optional)" className="p-2 rounded bg-gray-700 border border-gray-600" />
        <textarea placeholder="Notes / Context — Budget, headcount, date, vibe..." className="p-2 rounded bg-gray-700 border border-gray-600" />
        <div className="flex gap-2 mt-3">
          <button type="button" className="flex-1 bg-green-600 hover:bg-green-700 p-2 rounded text-white">Draft Intro</button>
          <button type="button" className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded text-white">Save Lead</button>
        </div>
      </form>
    </div>
  );
}
