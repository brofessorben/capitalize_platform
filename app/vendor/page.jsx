export default function VendorDash() {
  function KPI({ label, value }) {
    return <div className="rounded-2xl border p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-bold">{value}</div></div>;
  }

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-green-700">Vendor Dashboard</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-blue-500"><p className="text-lg text-gray-600">Available Leads</p><p className="text-2xl font-bold text-blue-600">2</p></div>
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-orange-500"><p className="text-lg text-gray-600">Proposals Submitted</p><p className="text-2xl font-bold text-orange-600">1</p></div>
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-teal-500"><p className="text-lg text-gray-600">Confirmed Bookings</p><p className="text-2xl font-bold text-teal-600">1</p></div>
        <div className="flex-1 bg-white p-5 rounded-lg border-l-4 border-red-500"><p className="text-lg text-gray-600">Pending Payouts</p><p className="text-2xl font-bold text-red-600">$50.00</p></div>
      </div>
    </div>
  );
}
