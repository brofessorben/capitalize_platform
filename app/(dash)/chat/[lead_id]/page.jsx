"use client";

import { useState } from "react";

export default function ChatPage({ params }) {
  const { lead_id } = params;
  const [sender, setSender] = useState("vendor");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Chat • Lead: {lead_id}</h1>

      <div className="flex gap-2">
        <button onClick={() => setSender("vendor")} className="px-3 py-1.5 border rounded-xl">Vendor</button>
        <button onClick={() => setSender("host")} className="px-3 py-1.5 border rounded-xl">Host</button>
        <button onClick={() => setSender("referrer")} className="px-3 py-1.5 border rounded-xl">Referrer</button>
      </div>

      <div className="rounded-2xl border p-4 bg-gray-50">Thread will go here.</div>
    </div>
  );
}
