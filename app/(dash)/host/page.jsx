export default function HostDash() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Host Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Open Requests</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Proposals Received</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Booked</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Rewards</div>
          <div className="text-2xl font-bold">$0.00</div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Your Events</h2>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-400">
          Create events (soon): choose date/time, headcount, and needs. Vendors apply or get matched.
        </div>
      </section>
    </div>
  );
}
