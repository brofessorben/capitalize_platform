"use client";

import dynamic from "next/dynamic";
const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });
const EventList  = dynamic(() => import("../../components/eventlist"),  { ssr: false });

export default function VendorDash() {
  const events = [
    { id: "proposal-amy-wedding", title: "Proposal • Amy’s Wedding", date: "Oct 17, 2025" },
    { id: "proposal-corp-holiday", title: "Proposal • Corp Holiday", date: "Dec 12, 2025" },
  ];

  return (
    <div className="space-y-6">
      <AIChatPage role="vendor" header="Vendor Console" />
      <EventList events={events} />
    </div>
  );
}
