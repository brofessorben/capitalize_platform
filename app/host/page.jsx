"use client";
import BackButton from "../components/BackButton";

export default function HostDash() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <BackButton />
      </div>
      {/* host content here */}
    </div>
  );
}
