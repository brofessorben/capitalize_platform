"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

export default function VendorDash() {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    fetch("/api/proposals?status=draft&limit=50")
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <BackButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Draft Proposals" value={proposals.length} />
        <KPI label="Booked" value="—" />
        <KPI label="Open Leads" value="—" />
        <KPI label="Payouts" value="—" />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Draft Proposals</h2>
        <div className="grid gap-3">
          {proposals.length === 0 && (
            <div className="rounded-2xl border p-4 text-sm text-gray-600">
              No drafts yet.
            </div>
          )}
          {proposals.map((p) => {
            const t = p.terms || {};
            return (
              <div key={p.id} className="rounded-2xl border p-4">
                <div className="font-semibold">{t.event_type || t.industry || "Deal"}</div>
                <div className="text-sm text-gray-600">
                  {t.headcount ? `${t.headcount} ppl` : "—"}
                  {t.price_per_person ? ` • $${t.price_per_person}/pp` : ""}
                  {t.subtotal ? ` • $${t.subtotal}` : ""}
                </div>
                <div className="text-xs text-gray-500 mt-1">{t.notes}</div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/chat/${p.lead_id}`} className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">
                    Open Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
