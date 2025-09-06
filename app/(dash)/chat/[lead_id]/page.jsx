"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../../components/aichatpage"), { ssr: false });

export default function LeadChatPage({ params }) {
  const { lead_id } = params || {};
  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      <AIChatPage role="referrer" header={`Chat • ${lead_id || "Lead"}`} />
    </div>
  );
}
