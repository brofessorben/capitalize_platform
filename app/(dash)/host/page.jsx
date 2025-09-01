import HelpAI from "../../components/HelpAI";

export default function HostDash() {
  return (
    <div className="p-6 space-y-8 text-neutral-200 bg-neutral-950 min-h-[80vh] rounded-2xl border border-neutral-900">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <div className="text-xs text-neutral-400">
          Create requests and compare proposals.
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Open Requests" value="0" />
        <KPI label="Proposals Received" value="0" />
        <KPI label="Booked" value="0" />
        <KPI label="Rewards" value="$0.00" />
      </section>

      {/* Events */}
      <section className="space-y-3">
        <h2 className="font-semibold">Your Events</h2>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm text-neutral-300">
          Create events (soon): choose date/time, headcount, and needs. Vendors apply or get matched.
        </div>
      </section>

      {/* Assistant floating widget */}
      <HelpAI role="host" userId="dev-ben" />
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="text-sm text-neutral-400">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
