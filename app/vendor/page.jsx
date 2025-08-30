"use client";
import BackButton from "../components/BackButton";

export default function VendorDash() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <BackButton />
      </div>
      {/* vendor content here */}
    </div>
  );
}
