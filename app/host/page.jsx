export default function HostDash() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Host Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border p-4">Open Requests: 0</div>
        <div className="rounded-2xl border p-4">Proposals Received: 0</div>
        <div className="rounded-2xl border p-4">Booked: 0</div>
        <div className="rounded-2xl border p-4">Rewards: $0.00</div>
      </div>
    </div>
  );
}
