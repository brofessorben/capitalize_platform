"use client";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import HelpAI from "@/app/components/HelpAI";

export default function VendorDash() {
  return (
    <div className="min-h-dvh bg-black text-neutral-100">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Vendor Dashboard
            </h1>
            <p className="text-neutral-400 mt-1">
              Get qualified leads, send proposals, and book more with less effort.
            </p>
          </div>
          <BackButton />
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI label="Open Leads" value="0" />
          <KPI label="Proposals Sent" value="0" />
          <KPI label="Booked" value="0" />
          <KPI label="Payouts" value="$0.00" />
        </div>

        {/* Inbox Preview */}
        <section className="space-y-3">
          <h2 className="font-semibold">Lead Inbox</h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60">
            <table className="w-full text-sm">
              <thead className="text-neutral-400">
                <tr className="border-b border-neutral-900">
                  <th className="text-left px-4 py-3">Lead</th>
                  <th className="text-left px-4 py-3">Context</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-200">
                <tr>
                  <td className="px-4 py-3">–</td>
                  <td className="px-4 py-3">No leads yet</td>
                  <td className="px-4 py-3">–</td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/host" className="underline">Browse requests</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500">
            Newest first. Click “Open Chat” to negotiate and send proposals.
          </p>
        </section>

        {/* Quick Actions */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card
            title="Connect Payouts"
            body="Add your payout details so you can get paid instantly on bookings."
            cta={{ href: "/vendor/payouts", label: "Set Up" }}
          />
          <Card
            title="Your Profile"
            body="Tell us what you offer. AI will tailor proposals to your style."
            cta={{ href: "/vendor/profile", label: "Edit Profile" }}
          />
          <Card
            title="Learn the Flow"
            body="See exactly how leads move from intro to signed and paid."
            cta={{ href: "/faq", label: "Learn More" }}
          />
        </section>
      </div>

      {/* In-app helper */}
      <HelpAI role="vendor" userId="dev-ben" />
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className="text-xs uppercase tracking-wider text-neutral-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Card({ title, body, cta }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5">
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-neutral-300 mt-2">{body}</p>
      {cta && (
        <div className="mt-4">
          <Link
            href={cta.href}
            className="inline-block px-4 py-2 rounded-xl border border-purple-400 hover:bg-purple-600 hover:text-white"
          >
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}
