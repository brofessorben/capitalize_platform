import React from "react";
import AIChatPage from '../../components/AIChatPage';

export default function HostDash() {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Host Dashboard</h1>
      <AIChatPage />
    </div>
  );
}
