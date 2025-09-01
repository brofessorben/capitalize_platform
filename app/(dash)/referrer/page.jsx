"use client";
import Link from "next/link";
import BackButton from "../../components/BackButton";
import HelpAI from "../../components/HelpAI";

export default function ReferrerDash() {
  return (
    <div className="min-h-dvh bg-black text-neutral-100">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Referrer Dashboard
            </h1>
            <p className="text-neutral-400 mt-1">
              Drop leads, track status, and get paid automatically.
            </p>
          </div>
          <BackButton />
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI label="Total Leads" value="0" />
          <KPI label="Qualified" value="0" />
          <KPI label="Booked" value="0" />
          <KPI label="Rewards" value="$0.00" />
        </div>

        {/* Actions */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card
            title="Drop a Lead"
            body="Know a host planning an event? Share their need in 30 seconds."
            cta={{ href: "/referrer/new", label: "New Lead" }}
          />
          <Card
            title="Invite a Vendor"
            body="Bring your favorite vendors. They’ll get prioritized for your leads."
            cta={{ href: "/vendor", label: "Invite Vendor" }}
          />
          <Card
            title="See Your Rewards"
            body="Track payouts and lifetime rewards from repeat business."
            cta={{ href: "/referrer/rewards", label: "View Rewards" }}
          />
        </section>

        {/* Recent Leads */}
        <section className="space-y-3">
          <h2 className="font-semibold">Recent Leads</h2>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60">
            <table className="w-full text-sm">
              <thead className="text-neutral-400">
                <tr className="border-b border-neutral-900">
                  <th className="text-left px-4 py-3">Host</th>
                  <th className="text-left px-4 py-3">Need</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-200">
                <tr>
                  <td className="px-4 py-3">–</td>
                  <td className="px-4 py-3">–</td>
                  <td className="px-4 py-3">No leads yet</td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/referrer/new" className="underline">Create one</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500">
            Newest first. Bookings automatically credit your rewards.
          </p>
        </section>
      </div>

      <HelpAI role="referrer" userId="dev-ben" />
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
