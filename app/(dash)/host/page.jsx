"use client";

import dynamic from "next/dynamic";
const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });
const EventList  = dynamic(() => import("../../components/eventlist"),  { ssr: false });

export default function HostDash() {
  const events = [
    { id: "host-amy-wedding", title: "Planning • Amy’s Wedding", date: "Oct 17, 2025" },
    { id: "host-bday-bash", title: "Planning • 40th Bash", date: "Aug 2, 2025" },
  ];

  return (
    <div className="space-y-6">
      <AIChatPage role="host" header="Host Console" />
      <EventList events={events} />
    </div>
  );
}
