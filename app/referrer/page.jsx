export default function ReferrerDash() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrer Dashboard</h1>
        <a
          href="/chat/demo-123"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:opacity-90"
        >
          Start Chat (demo)
        </a>
      </div>

      <div className="rounded-2xl border p-5 bg-white">
        <div className="text-sm text-gray-600">
          Your referred leads will appear here as they come in.
        </div>
      </div>
    </div>
  );
}
