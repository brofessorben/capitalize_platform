"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });

export default function HostDash() {
  return <AIChatPage role="host" header="Host Console" />;
}
