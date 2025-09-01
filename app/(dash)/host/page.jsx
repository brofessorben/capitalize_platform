import AIChatPage from "@/app/components/AIChatPage";

export default function HostDash() {
  return (
    <AIChatPage
      role="host"
      title="Host Command Center"
      kpis={[
        { label: "Requests", value: "1" },
        { label: "Proposals Received", value: "0" },
        { label: "Booked", value: "0" },
      ]}
      quickPrompts={[
        "Create a new request",
        "Compare proposals",
        "What should I ask vendors?",
      ]}
    />
  );
}
