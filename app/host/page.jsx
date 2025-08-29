export default function HostDash() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Host Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Open Requests" value="0" />
        <KPI label="Proposals Received" value="0" />
        <KPI label="Booked" value="0" />
        <KPI label="Rewards" value="$0.00" />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Your Events</h2>
        <div className="rounded-2xl border p-4 text-sm text-gray-600">
          Create events (soon): choose date/time, headcount, and needs. Vendors apply or get matched.
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
