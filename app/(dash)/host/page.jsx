"use client";

import dynamic from "next/dynamic";

// RELATIVE import (no alias)
const AIChatPage = dynamic(
  () => import("../../components/aichatpage"),
  { ssr: false }
);

export default function HostDash() {
  return <AIChatPage role="host" header="Host Console" />;
}
