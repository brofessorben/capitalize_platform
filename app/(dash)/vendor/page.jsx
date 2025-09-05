"use client";

import dynamic from "next/dynamic";

// RELATIVE import (no alias)
const AIChatPage = dynamic(
  () => import("../../components/aichatpage"),
  { ssr: false }
);

export default function VendorDash() {
  return <AIChatPage role="vendor" header="Vendor Console" />;
}
