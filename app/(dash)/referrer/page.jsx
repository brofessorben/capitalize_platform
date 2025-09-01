// app/(dash)/referrer/page.jsx
export default function ReferrerDash() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Referrer Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Total Referrals</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Pending Payouts</div>
          <div className="text-2xl font-bold">$0.00</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Accepted</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
          <div className="text-sm text-neutral-400">Declined</div>
          <div className="text-2xl font-bold">0</div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Recent Referrals</h2>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-400">
          Nothing here yet. Drop a lead from the home page to get started.
        </div>
      </section>
    </div>
  );
}
