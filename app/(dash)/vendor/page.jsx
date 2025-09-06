"use client";

import dynamic from "next/dynamic";

const AIChatPage = dynamic(() => import("../../components/aichatpage"), { ssr: false });

export default function VendorDash() {
  return <AIChatPage role="vendor" header="Vendor Console" />;
}
