"use client";

import BackButton from "../../components/BackButton";

export default function ReferrerDash() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrer Dashboard</h1>
        <BackButton />
      </div>

      <div className="rounded-2xl border p-4">
        <p className="text-gray-600">
          Your referred leads will show here. Submit a lead and track its progress.
        </p>
      </div>
    </div>
  );
}
