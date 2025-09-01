export default function VendorDash() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Vendor Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Open Leads</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Proposals Sent</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Booked</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Payouts</div>
          <div className="text-2xl font-bold">$0.00</div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Inbox (Leads)</h2>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-400">
          No leads yet. You’ll see AI-drafted proposals here ready to send.
        </div>
      </section>
    </div>
  );
}
