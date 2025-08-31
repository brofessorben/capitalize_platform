export default function HostDash() {
  function KPI({ label, value }) {
    return <div className="rounded-2xl border p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-bold">{value}</div></div>;
  }

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-blue-800">Host Dashboard Overview</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-green-500"><p className="text-lg text-gray-700">Pending Requests</p><p className="text-2xl font-bold text-green-600">2</p></div>
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-yellow-500"><p className="text-lg text-gray-700">Proposals in Review</p><p className="text-2xl font-bold text-yellow-600">1</p></div>
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-purple-500"><p className="text-lg text-gray-700">Confirmed Bookings</p><p className="text-2xl font-bold text-purple-600">1</p></div>
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-red-500"><p className="text-lg text-gray-700">Earned Rewards</p><p className="text-2xl font-bold text-red-600">$50.00</p></div>
      </div>
    </div>
  );
}
