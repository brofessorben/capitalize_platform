// app/(dash)/referrer/page.jsx
"use client";
import dynamic from "next/dynamic";
import EventList from "@/app/components/eventlist";

const AIChatPage = dynamic(() => import("@/app/components/aichatpage"), { ssr: false });

export default function ReferrerDash() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <AIChatPage role="referrer" header="Referrer Console" />
      </div>
      <div>
        <h3 className="text-zinc-100 font-semibold mb-3">Your Events</h3>
        <EventList roleFilter="referrer" />
      </div>
    </div>
  );
}
