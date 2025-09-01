"use client";
import Link from "next/link";
import HelpAI from "../../components/HelpAI";

export default function HostDash() {
  return (
    <div className="space-y-8">
      <Hero
        title="Host Dashboard"
        subtitle="Create requests with your budget & constraints, compare proposals, and book confidently."
      />

      {/* Create Request */}
      <section className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Create an Event Request</h2>
          <Link
            href="/(dash)/host/new"
            className="px-3 py-1.5 rounded-lg border border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white transition"
          >
            New Request
          </Link>
        </div>
        <p className="text-sm text-neutral-400">
          Date, headcount, budget, dietary needs, logistics—give us the constraints and we’ll bring the options.
        </p>
      </section>

      {/* Your Events */}
      <section className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Your Events</h2>
          <Link
            href="/(dash)/host/events"
            className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-purple-500 hover:text-purple-300 transition"
          >
            View All
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-neutral-400">
              <tr className="border-b border-neutral-900">
                <th className="text-left p-3">Event</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <EvtRow name="Holiday Party" date="Dec 18" status="Reviewing Proposals" />
              <EvtRow name="Quarterly Offsite" date="Nov 10" status="Collecting Requirements" />
            </tbody>
          </table>
        </div>
      </section>

      <HelpAI role="host" userId="dev-ben" />
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

function EvtRow({ name, date, status }) {
  return (
    <tr className="border-b border-neutral-900">
      <td className="p-3">{name}</td>
      <td className="p-3">{date}</td>
      <td className="p-3">{status}</td>
      <td className="p-3 text-right">
        <Link href="/(dash)/chat/host-abc" className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-600 transition">
          Ask AI
        </Link>
      </td>
    </tr>
  );
}
