import BackButton from "../../components/BackButton";

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function VendorDash() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <BackButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Open Leads" value="0" />
        <KPI label="Proposals Sent" value="0" />
        <KPI label="Booked" value="0" />
        <KPI label="Payouts" value="$0.00" />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Inbox (Leads)</h2>
        <div className="rounded-2xl border p-4 text-sm text-gray-600">
          No leads yet. You’ll see AI-drafted proposals here ready to send. Newest first.
          Click "Open Chat" to negotiate and send proposals.
        </div>
      </section>
    </div>
  );
}
