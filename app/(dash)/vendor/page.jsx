"use client";

import BackButton from "../../components/BackButton";

export default function VendorDash() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <BackButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Open Leads" value="0" />
        <KPI label="Proposals Sent" value="0" />
        <KPI label="Booked" value="0" />
        <KPI label="Payouts" value="$0.00" />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Inbox (Leads)</h2>
        <div className="rounded-2xl border p-4 text-sm text-gray-600">
          No leads yet. You’ll see AI-drafted proposals here ready to send.
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
}        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60">
          <table className="w-full text-sm">
            <thead className="text-neutral-400">
              <tr className="border-b border-neutral-900">
                <Th>Lead</Th>
                <Th>From</Th>
                <Th>When</Th>
                <Th className="text-right pr-4">Action</Th>
              </tr>
            </thead>
            <tbody>
              {/* Sample row that links to chat page — replace id when real leads exist */}
              <Row
                leadId="demo-123"
                title="Corporate Lunch • 120 ppl"
                from="Referrer • Jamie"
                when="Just now"
              />
              {/* Add more rows as your API returns data */}
            </tbody>
          </table>
          <div className="p-4 text-xs text-neutral-400 border-t border-neutral-900">
            Newest first. Click “Open Chat” to negotiate and send proposals.
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h2 className="font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            title="Draft Proposal"
            desc="Generate a proposal from an active chat."
            href="/(dash)/vendor" // replace with your proposal builder route later
          />
          <ActionCard
            title="View Payouts"
            desc="See upcoming and completed payouts."
            href="/(dash)/vendor" // replace with real payouts route later
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- Bits ---------- */

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className="text-sm text-neutral-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`text-left px-4 py-3 font-medium ${className}`}>{children}</th>
  );
}

function Row({ leadId, title, from, when }) {
  return (
    <tr className="border-b border-neutral-900/80 hover:bg-neutral-900/40 transition">
      <Td>{title}</Td>
      <Td className="text-neutral-400">{from}</Td>
      <Td className="text-neutral-400">{when}</Td>
      <Td className="text-right">
        {/* Chat lives at /(dash)/chat/[lead_id]/page.jsx */}
        <Link
          href={`/chat/${leadId}`}
          className="inline-flex items-center px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition"
        >
          Open Chat
        </Link>
      </Td>
    </tr>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function ActionCard({ title, desc, href }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 hover:bg-neutral-900/40 transition block"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-neutral-400 mt-1">{desc}</div>
    </Link>
  );
}
