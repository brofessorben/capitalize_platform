"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-dvh text-gray-100 flex flex-col relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 bg-black">
        <div className="stars"></div>
        <div className="twinkling"></div>
        <div className="galaxy-glow"></div>
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
          <Link
            href="/referrer"
            className="px-4 py-2 rounded-xl border border-purple-400 bg-purple-600 hover:bg-purple-500 hover:text-white transition"
          >
            Start Referring
          </Link>
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
            <Link href="/referrer" className="px-6 py-3 rounded-2xl bg-purple-600 text-white hover:bg-purple-500">
              Start Referring
            </Link>
            <a href="#features" className="px-6 py-3 rounded-2xl border border-purple-400 hover:bg-purple-600 hover:text-white">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-700 relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-10 flex justify-between text-sm text-gray-400">
          <div className="font-semibold">CAPITALIZE</div>
          <div>Freedom • Joy • Growth</div>
          <div>© {new Date().getFullYear()} CAPITALIZE</div>
        </div>
      </footer>

      {/* Styles for stars and galaxy */}
      <style jsx global>{`
        .stars, .twinkling, .galaxy-glow {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: block;
        }

        .stars {
          background: url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          z-index: 0;
        }

        .twinkling {
          background: transparent url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          animation: move-twink 200s linear infinite;
          z-index: 1;
          opacity: 0.5;
        }

        .galaxy-glow {
          background: radial-gradient(circle at center, rgba(128,0,128,0.5), transparent 70%);
          z-index: 2;
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes move-twink {
          from {background-position: 0 0;}
          to {background-position: -10000px 5000px;}
        }

        @keyframes pulse {
          0%, 100% {opacity: 0.6;}
          50% {opacity: 0.9;}
        }
      `}</style>
    </main>
  );
}