"use client";

import AIChatPage from "@/app/components/aichatpage";

export default function ChatPage({ params }) {
  const { lead_id } = params;
  return (
    <div className="h-full">
      <AIChatPage role="vendor" header={`Chat for Lead: ${lead_id}`} />
    </div>
  );
}
