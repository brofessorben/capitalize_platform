import HelpAI from "../../components/HelpAI";

export default function ReferrerDash() {
  return (
    <div className="p-6 space-y-8 text-neutral-200 bg-neutral-950 min-h-[80vh] rounded-2xl border border-neutral-900">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrer Dashboard</h1>
        <div className="text-xs text-neutral-400">
          Drop leads and track rewards.
        </div>
      </header>

      {/* How to refer */}
      <section className="space-y-3">
        <h2 className="font-semibold">Get Started</h2>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm text-neutral-300">
          No referrals yet. Use the lead form to submit a host and a vendor you trust.
          We’ll draft outreach and proposals automatically.
        </div>
      </section>

      {/* Assistant floating widget */}
      <HelpAI role="referrer" userId="dev-ben" />
    </div>
  );
}
