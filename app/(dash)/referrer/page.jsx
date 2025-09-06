"use client";
import dynamic from "next/dynamic";
const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });

export default function ReferrerDash() {
  return <AIChatPage role="referrer" header="Referrer Console" />;
}
