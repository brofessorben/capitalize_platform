export default function VendorDash() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <a
          href="/chat/demo-123"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:opacity-90"
        >
          Open Lead Chat (demo)
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border p-4">Open Leads: 0</div>
        <div className="rounded-2xl border p-4">Proposals Sent: 0</div>
        <div className="rounded-2xl border p-4">Booked: 0</div>
        <div className="rounded-2xl border p-4">Payouts: $0.00</div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Inbox (Leads)</h2>
        <div className="rounded-2xl border p-4 text-sm text-gray-600 bg-white">
          No leads yet. You’ll see AI-drafted proposals here ready to send.
        </div>
      </section>
    </div>
  );
}
