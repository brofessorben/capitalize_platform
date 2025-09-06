"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });
const EventList   = dynamic(() => import("../../components/eventlist"),   { ssr: false });

export default function HostDash() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <AIChatPage role="host" header="Host Console" />
      <div className="mt-10" />
      <EventList />
    </div>
  );
}
