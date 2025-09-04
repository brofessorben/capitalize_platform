// Ensure this file is an ES module for TypeScript’s checker
import React from "react";
import AIChatPage from "../../components/AIChatPage";

export const metadata = {
  title: "Referrer Dashboard",
};

export default function ReferrerDash() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Referrer Dashboard</h1>
      <AIChatPage />
    </div>
  );
}
