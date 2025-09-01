import AIChatPage from "@/app/components/AIChatPage";

export default function VendorDash() {
  return (
    <AIChatPage
      role="vendor"
      title="Vendor Command Center"
      kpis={[
        { label: "Open Leads", value: "2" },
        { label: "Proposals Sent", value: "5" },
        { label: "Payouts", value: "$0.00" },
      ]}
      quickPrompts={[
        "Draft a catering proposal",
        "Help me price per person",
        "Negotiate this reply",
      ]}
    />
  );
}
