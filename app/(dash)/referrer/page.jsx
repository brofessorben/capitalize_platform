"use client";

import React, { useEffect } from "react";
import UserGate from "../../components/userGate";
import AIChatPage from "../../components/aichatpage";
import EventList from "../../components/eventlist";
import { ensureProfile } from "@/lib/ensureProfile";

export default function ReferrerPage() {
  useEffect(() => {
    ensureProfile(); // creates/updates profile row for the logged in user
  }, []);

  return (
    <UserGate>
      <div className="mx-auto max-w-6xl p-4 md:p-6 text-white">
        <AIChatPage role="referrer" header="Referrer Console" />
        <div className="mt-8">
          <EventList role="referrer" />
        </div>
      </div>
    </UserGate>
  );
}
