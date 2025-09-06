// app/(dash)/chat/[event_id]/page.jsx
"use client";
import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("@/app/components/aichatpage"), { ssr: false });

export default function EventChatPage({ params }) {
  const { event_id } = params;
  return <AIChatPage header="Event Thread" eventId={event_id} />;
}
