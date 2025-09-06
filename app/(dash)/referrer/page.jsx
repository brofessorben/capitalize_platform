"use client";

import dynamic from "next/dynamic";

// client components
const AIChatPage = dynamic(() => import("../../components/aichatpage"), {
  ssr: false,
});
const EventList = dynamic(() => import("../../components/eventlist"), {
  ssr: false,
});

export default function ReferrerDash() {
  return (
    <div className="min-h-[100vh] flex flex-col">
      <AIChatPage role="referrer" header="Referrer Console" />
      <EventList role="referrer" />
    </div>
  );
}
