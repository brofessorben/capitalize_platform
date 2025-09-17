"use client";

import React, { useEffect, useState } from "react";
import UserGate from "../../components/userGate";
import AIChatPage from "../../components/aichatpage";
import EventList from "../../components/eventlist";
import { ensureProfile } from "@/lib/ensureProfile";

export default function VendorPage() {
  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    try {
      ensureProfile();
    } catch (e) {
      console.warn("ensureProfile failed (non-blocking):", e?.message || e);
    }
  }, []);

  return (
    <UserGate>
      <main className="mx-auto max-w-6xl p-4 md:p-6 text-white">
        <AIChatPage
          role="vendor"
          header="Vendor Console"
          initialEventId={activeEvent}
        />
        <div className="mt-8">
          <EventList role="vendor" onSelect={setActiveEvent} />
        </div>
      </main>
    </UserGate>
  );
}
