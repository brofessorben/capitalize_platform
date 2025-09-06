"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });
const EventList = dynamic(() => import("../../components/eventlist"), { ssr: false });

export default function ReferrerDash() {
  return (
    <div className="space-y-6">
      <AIChatPage role="referrer" header="Referrer Console" />
      <EventList events={[{ title: "Lead for Amy’s Wedding", date: "Oct 17, 2025" }]} />
    </div>
  );
}
