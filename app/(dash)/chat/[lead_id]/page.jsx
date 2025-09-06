"use client";

import AIChatPage from "@/app/components/aichatpage";

export default function ChatForLead({ params, searchParams }) {
  const { lead_id } = params;
  const role = (searchParams?.role || "vendor").toLowerCase();
  const header = `Chat — ${role.charAt(0).toUpperCase() + role.slice(1)}`;

  return <AIChatPage role={role} header={header} leadId={lead_id} showLeadForm={role === "referrer"} />;
}
