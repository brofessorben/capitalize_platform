"use client";
import BackButton from "@/app/components/BackButton";

export default function HostDash() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <BackButton />
      </div>

      <div className="rounded-2xl border p-6 bg-white">
        <p className="text-gray-600">
          Host tools coming soon — track proposals, confirm bookings, and chat with vendors/AI.
        </p>
      </div>
    </div>
  );
}
