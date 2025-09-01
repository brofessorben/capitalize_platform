"use client";
import Link from "next/link";
import HelpAI from "../../components/HelpAI";

export default function VendorDash() {
  return (
    <div className="space-y-8">
      <Hero
        title="Vendor Dashboard"
        subtitle="Qualified leads, AI-drafted proposals, and one thread to negotiate & close."
      />

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Open Leads" value="0" />
        <KPI label="Proposals Sent" value="0" />
        <KPI label="Booked" value="0" />
        <KPI label="Payouts" value="$0.00" />
      </section>

      {/* Inbox */}
      <section className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Inbox (Leads)</h2>
          <Link
            href="/(dash)/vendor/leads"
            className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-purple-500 hover:text-purple-300 transition"
          >
            View All
          </Link>
        </div>
        <div className="text-sm text-neutral-400 mb-4">
          Newest first. Click “Open Chat” to negotiate and send proposals.
        </div>

        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-neutral-400">
              <tr className="border-b border-neutral-900">
                <th className="text-left p-3">Lead</th>
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Budget</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <Row lead="Startup Launch" when="Oct 9" budget="$7k" status="Needs Proposal" />
              <Row lead="Holiday Party" when="Dec 18" budget="$12k" status="Chatting" />
              <Row lead="Conference Lunch" when="Nov 6" budget="$4k" status="New" />
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-3">
        <Action title="Create Proposal" body="Use AI to draft a proposal in seconds from a lead brief." />
        <Action title="Upload Menu/Deck" body="Give AI more context to personalize proposals." />
        <Action title="Connect Calendar" body="Let hosts see availability fast." />
      </section>

      <HelpAI role="vendor" userId="dev-ben" />
    </div>
  );
}

function Hero({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-neutral-900 bg-gradient-to-br from-purple-900/30 via-black to-black p-6">
      <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-neutral-300">{subtitle}</p>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4">
      <div className="text-sm text-neutral-400">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Row({ lead, when, budget, status }) {
  return (
    <tr className="border-b border-neutral-900">
      <td className="p-3">{lead}</td>
      <td className="p-3">{when}</td>
      <td className="p-3">{budget}</td>
      <td className="p-3">{status}</td>
      <td className="p-3 text-right">
        <Link href="/(dash)/chat/123" className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600 transition">
          Open Chat
        </Link>
      </td>
    </tr>
  );
}

function Action({ title, body }) {
  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm text-neutral-400">{body}</div>
    </div>
  );
}
