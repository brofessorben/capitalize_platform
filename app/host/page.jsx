export default function HostDash() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <a
          href="/chat/demo-123"
          className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:opacity-90"
        >
          Message Vendor (demo)
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border p-4">Open Requests: 0</div>
        <div className="rounded-2xl border p-4">Proposals Received: 0</div>
        <div className="rounded-2xl border p-4">Booked: 0</div>
        <div className="rounded-2xl border p-4">Rewards: $0.00</div>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Your Events</h2>
        <div className="rounded-2xl border p-4 text-sm text-gray-600 bg-white">
          Create events (soon): choose date/time, headcount, and needs. Vendors apply or get matched.
        </div>
      </section>
    </div>
  );
}
