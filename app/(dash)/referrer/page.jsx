"use client";
import Link from "next/link";
import HelpAI from "../../components/HelpAI";

export default function ReferrerDash() {
  return (
    <div className="space-y-8">
      <Hero
        title="Referrer Dashboard"
        subtitle="Drop great leads. Track statuses. Get paid automatically on wins & repeat business."
      />

      {/* Quick-add Lead */}
      <section className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add a Lead</h2>
          <Link
            href="/(dash)/referrer/new"
            className="px-3 py-1.5 rounded-lg border border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white transition"
          >
            New Lead
          </Link>
        </div>
        <p className="text-sm text-neutral-400">
          Provide a host name, contact, date (if known), headcount, budget, and what they need.
        </p>
      </section>

      {/* Pipeline */}
      <section className="grid gap-4 md:grid-cols-3">
        <Board title="New" hint="Freshly submitted leads">
          <LeadCard who="Acme Co. Holiday Party" when="Dec 18" budget="$12k" status="Unassigned" />
          <LeadCard who="Maya — 30th Birthday" when="Nov 2" budget="$3k" status="Matching" />
        </Board>
        <Board title="In Motion" hint="Vendors drafting/negotiating">
          <LeadCard who="Startup Launch" when="Oct 9" budget="$7k" status="Proposal Sent" />
        </Board>
        <Board title="Won" hint="Booked & accruing rewards">
          <LeadCard who="Nonprofit Gala" when="Sep 28" budget="$25k" status="Booked" highlight />
        </Board>
      </section>

      {/* Rewards */}
      <section className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Rewards</h2>
            <p className="text-sm text-neutral-400">Auto-tracked. Paid out when the event books.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">$0.00</div>
            <div className="text-xs text-neutral-400">lifetime pending</div>
          </div>
        </div>
      </section>

      {/* Floating AI for this role */}
      <HelpAI role="referrer" userId="dev-ben" />
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

function Board({ title, hint, children }) {
  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-xs text-neutral-500">{hint}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function LeadCard({ who, when, budget, status, highlight = false }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-purple-600 bg-purple-950/30" : "border-neutral-800 bg-neutral-900/40"}`}>
      <div className="flex items-center justify-between">
        <div className="font-medium">{who}</div>
        <div className="text-xs px-2 py-0.5 rounded border border-neutral-700 text-neutral-300">{status}</div>
      </div>
      <div className="mt-2 text-sm text-neutral-400">When: {when} • Budget: {budget}</div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600 transition">
          View
        </button>
        <button className="px-3 py-1.5 rounded-lg border border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white transition">
          Share Link
        </button>
      </div>
    </div>
  );
}
