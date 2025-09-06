"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });
const EventList = dynamic(() => import("../../components/eventlist"), { ssr: false });

export default function HostDash() {
  return (
    <div className="space-y-6">
      <AIChatPage role="host" header="Host Console" />
      <EventList events={[{ title: "Wedding Planning", date: "Oct 17, 2025" }]} />
    </div>
  );
}
