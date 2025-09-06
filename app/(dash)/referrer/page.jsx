"use client";

import dynamic from "next/dynamic";
const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });
const EventList  = dynamic(() => import("../../components/eventlist"),  { ssr: false });

export default function ReferrerDash() {
  const events = [
    { id: "lead-amy-wedding", title: "Lead • Amy’s Wedding", date: "Oct 17, 2025" },
    { id: "lead-corp-holiday", title: "Lead • Corp Holiday", date: "Dec 12, 2025" },
  ];

  return (
    <div className="space-y-6">
      <AIChatPage role="referrer" header="Referrer Console" showLeadForm />
      <EventList events={events} />
    </div>
  );
}
