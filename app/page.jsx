"use client";
import Link from "next/link";
import HelpAI from "./components/HelpAI";

export default function LandingPage() {
  return (
    <main className="min-h-dvh text-gray-100 flex flex-col relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 bg-black">
        <div className="stars"></div>
        <div className="twinkling"></div>
        <div className="galaxy-glow"></div>
        {/* Tiny R/W/B sparkle layer (only dots flicker, not whole bg) */}
        <div className="sparkle-layer"></div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black tracking-tight text-xl text-white">
            CAPITALIZE
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="hover:text-purple-300">How it Works</a>
            <a href="#roles" className="hover:text-purple-300">Roles</a>
            <a href="#features" className="hover:text-purple-300">Features</a>
            <a href="#faq" className="hover:text-purple-300">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/(dash)/referrer"
              className="px-4 py-2 rounded-xl border border-purple-400 bg-purple-600 hover:bg-purple-500 hover:text-white transition"
            >
              Start Referring
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="flex-1 flex items-center justify-center relative z-10">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent animate-pulse">
            Connect. Refer. Get Paid.
          </h1>
          <p className="mt-6 text-lg text-gray-300 max-w-xl mx-auto">
            CAPITALIZE is the reverse-Amazon powered by people. Spot a host who needs a
            vendor, drop the lead, and our AI handles the rest — proposals, chat, and instant payouts.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/(dash)/referrer" className="px-6 py-3 rounded-2xl bg-purple-600 text-white hover:bg-purple-500">
              Referrers
            </Link>
            <Link href="/(dash)/vendor" className="px-6 py-3 rounded-2xl border border-purple-400 hover:bg-purple-600 hover:text-white">
              Vendors
            </Link>
            <Link href="/(dash)/host" className="px-6 py-3 rounded-2xl border border-purple-400 hover:bg-purple-600 hover:text-white">
              Hosts
            </Link>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="relative z-10 border-t border-gray-800 bg-black/60">
        <div className="mx-auto max-w-6xl px-6 py-16 grid gap-8 md:grid-cols-3">
          <Card
            title="Refer"
            body="See someone planning an event? Submit a quick lead with who/what/when."
          />
          <Card
            title="Match"
            body="Our AI drafts outreach and proposals for vendors that fit the brief."
          />
          <Card
            title="Get Paid"
            body="When it books, you get rewards automatically. Transparent and instant."
          />
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="relative z-10 border-t border-gray-800 bg-black/60">
        <div className="mx-auto max-w-6xl px-6 py-16 grid gap-6">
          <h2 className="text-2xl font-bold">Roles</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Role
              title="Referrers"
              points={[
                "Drop leads (host + need).",
                "Track status and rewards in your dashboard.",
                "One link, lifetime rewards on repeat business."
              ]}
              href="/(dash)/referrer"
            />
            <Role
              title="Vendors"
              points={[
                "Receive qualified leads with context.",
                "AI-drafted proposals you can edit and send.",
                "Book more with less back-and-forth."
              ]}
              href="/(dash)/vendor"
            />
            <Role
              title="Hosts"
              points={[
                "Create requests with budget and constraints.",
                "Compare proposals and chat in one place.",
                "Book confidently with transparency."
              ]}
              href="/(dash)/host"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 relative z-10 bg-black/70">
        <div className="mx-auto max-w-7xl px-6 py-10 flex justify-between text-sm text-gray-400">
          <div className="font-semibold">CAPITALIZE</div>
          <div>Freedom • Joy • Growth</div>
          <div>© {new Date().getFullYear()} CAPITALIZE</div>
        </div>
      </footer>

      {/* Floating AI helper (wide knowledge + app guide) */}
      <HelpAI role="landing" userId="dev-ben" />

      {/* Styles for stars and galaxy */}
      <style jsx global>{`
        .stars, .twinkling, .galaxy-glow, .sparkle-layer {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: block;
          pointer-events: none;
        }

        .stars {
          background: url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          z-index: 0;
          opacity: 0.6;
        }

        .twinkling {
          background: transparent url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          animation: move-twink 200s linear infinite;
          z-index: 1;
          opacity: 0.35;
        }

        .galaxy-glow {
          background: radial-gradient(1000px 600px at 50% 40%, rgba(128,0,128,0.45), rgba(0,0,0,0) 70%);
          z-index: 2;
          animation: pulse 8s ease-in-out infinite;
        }

        /* Small red/white/blue sparkles — only dots flicker color */
        .sparkle-layer {
          z-index: 3;
          background-image:
            radial-gradient(2px 2px at 10% 20%, rgba(255,0,0,0.9), rgba(0,0,0,0) 60%),
            radial-gradient(2px 2px at 30% 40%, rgba(255,255,255,0.9), rgba(0,0,0,0) 60%),
            radial-gradient(2px 2px at 70% 25%, rgba(0,120,255,0.9), rgba(0,0,0,0) 60%),
            radial-gradient(2px 2px at 85% 60%, rgba(255,255,255,0.9), rgba(0,0,0,0) 60%),
            radial-gradient(2px 2px at 45% 75%, rgba(255,0,0,0.9), rgba(0,0,0,0) 60%);
          background-repeat: no-repeat;
          animation: rwb-flicker 2.4s steps(3, end) infinite;
          opacity: 0.9;
        }

        @keyframes move-twink {
          from { background-position: 0 0; }
          to   { background-position: -10000px 5000px; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.85; }
        }

        /* Cycle the colors of each tiny dot without shifting whole background */
        @keyframes rwb-flicker {
          0% {
            filter: hue-rotate(0deg) saturate(1);
            opacity: 0.8;
          }
          33% {
            filter: hue-rotate(0deg) saturate(1.3);
            opacity: 1;
          }
          66% {
            filter: hue-rotate(210deg) saturate(1.3);
            opacity: 0.95;
          }
          100% {
            filter: hue-rotate(0deg) saturate(1);
            opacity: 0.85;
          }
        }
      `}</style>
    </main>
  );
}

/* ---- little helper cards ---- */
function Card({ title, body }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-black/50 p-6">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-gray-300">{body}</div>
    </div>
  );
}

function Role({ title, points, href }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-black/50 p-6">
      <div className="text-lg font-semibold">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-gray-300 list-disc list-inside">
        {points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      <div className="mt-4">
        <Link href={href} className="inline-block px-4 py-2 rounded-xl border border-purple-400 hover:bg-purple-600 hover:text-white">
          Open {title} Dashboard
        </Link>
      </div>
    </div>
  );
}
