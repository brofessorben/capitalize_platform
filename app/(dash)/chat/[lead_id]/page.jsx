"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../../components/aichatpage"), {
  ssr: false,
});

export default function ChatForLead({ params }) {
  const { lead_id } = params || {};
  return (
    <div className="min-h-[100vh] flex flex-col">
      <AIChatPage
        role="referrer"
        header={`Chat · Lead ${lead_id}`}
        initialEventId={lead_id}
      />
    </div>
  );
}
