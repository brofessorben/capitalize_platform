"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const AIChatPage = dynamic(() => import("../../../components/aichatpage"), { ssr: false });

export default function LeadChatPage() {
  const params = useParams();
  const id = params?.lead_id;
  return <AIChatPage role="vendor" header={`Chat • Lead ${id || ""}`} />;
}
