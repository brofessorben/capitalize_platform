"use client";

import dynamic from "next/dynamic";

// relative import (keeps casing exactly as in your repo)
const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });

export default function ReferrerDash() {
  return <AIChatPage role="referrer" header="Referrer Console" />;
}
