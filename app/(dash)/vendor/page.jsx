"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../components/aichatpage"), {
  ssr: false,
});
const EventList = dynamic(() => import("../../components/eventlist"), {
  ssr: false,
});

export default function VendorDash() {
  return (
    <div className="min-h-[100vh] flex flex-col">
      <AIChatPage role="vendor" header="Vendor Console" />
      <EventList role="vendor" />
    </div>
  );
}
