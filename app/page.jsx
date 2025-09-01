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
      </div>

      {/* SIMPLE HEADER — CAPITALIZE centered */}
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-center">
          <Link href="/" className="font-black tracking-tight text-xl text-white">
            CAPITALIZE
          </Link>
        </div>
      </header>

      {/* AI BUTTON (appears under the title; the chat pops right beneath it and is draggable) */}
      <HelpAI userId="dev-ben" role="guide" />

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
            <Link href="/referrer" className="px-6 py-3 rounded-2xl bg-purple-600 text-white hover:bg-purple-500">
              Referrers
            </Link>
            <Link href="/vendor" className="px-6 py-3 rounded-2xl border border-purple-400 hover:bg-purple-600 hover:text-white">
              Vendors
            </Link>
            <Link href="/host" className="px-6 py-3 rounded-2xl border border-purple-400 hover:bg-purple-600 hover:text-white">
              Hosts
            </Link>
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

      {/* Galaxy styles */}
      <style jsx global>{`
        .stars, .twinkling, .galaxy-glow {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: block;
          pointer-events: none;
        }

        .stars {
          background: url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          z-index: 0;
          opacity: 0.7;
        }

        .twinkling {
          background: transparent url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          animation: move-twink 200s linear infinite;
          z-index: 1;
          opacity: 0.35;
        }

        .galaxy-glow {
          background: radial-gradient(
            1000px 600px at 50% 40%,
            rgba(150, 0, 200, 0.55),
            rgba(0, 0, 0, 0) 70%
          );
          z-index: 2;
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes move-twink {
          from { background-position: 0 0; }
          to   { background-position: -10000px 5000px; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </main>
  );
}
