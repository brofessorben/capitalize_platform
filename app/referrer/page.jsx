"use client";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

export default function ReferrerDash() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrer Dashboard</h1>
        <BackButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Leads Submitted" value="0" />
        <KPI label="Accepted by Vendors" value="0" />
        <KPI label="Booked" value="0" />
        <KPI label="Payouts" value="$0.00" />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {/* If your lead form lives elsewhere, change the href accordingly */}
          <Link
            href="/referrer/new"
            className="px-4 py-2 rounded-2xl bg-black text-white"
          >
            + New Referral
          </Link>
          <Link
            href="/referrer/leads"
            className="px-4 py-2 rounded-2xl border hover:bg-gray-50"
          >
            View My Leads
          </Link>
          <Link
            href="/referrer/payouts"
            className="px-4 py-2 rounded-2xl border hover:bg-gray-50"
          >
            Payouts
          </Link>
        </div>
        <div className="rounded-2xl border p-4 text-sm text-gray-600">
          Track the status of your referrals, see when vendors accept, and get paid
          automatically when bookings confirm.
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
