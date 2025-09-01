import AIChatPage from "../../components/AIChatPage";

export default function ReferrerDash() {
  return (
    <AIChatPage
      role="referrer"
      title="Referrer Command Center"
      kpis={[
        { label: "Open Leads", value: "3" },
        { label: "Booked", value: "1" },
        { label: "Rewards", value: "$120.00" },
      ]}
      quickPrompts={[
        "Start a new referral",
        "Draft outreach for this host",
        "What’s the status of my leads?",
      ]}
    />
  );
}
