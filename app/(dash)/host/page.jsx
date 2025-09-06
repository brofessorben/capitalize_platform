"use client";

import { useState } from "react";
import AIChatPage from "../../components/aichatpage";
import EventList from "../../components/eventlist";

export default function HostDash() {
  const [eventId, setEventId] = useState(null);
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <AIChatPage role="host" header="Host Console" eventId={eventId} />
      <EventList role="host" activeId={eventId} onSelect={setEventId} />
    </div>
  );
}
