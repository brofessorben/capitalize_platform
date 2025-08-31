"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      {/* Background universe layers */}
      <div className="universe pointer-events-none">
        <div className="stars" />
        <div className="galaxy-glow" />
      </div>

      {/* Foreground content */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-28">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          CAPITALIZE
        </h1>
        <p className="mt-4 text-lg text-white/80 max-w-2xl">
          Connect. Refer. Get Paid.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/referrer"
            className="rounded-2xl bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-white/90"
          >
            Referrer
          </Link>
          <Link
            href="/vendor"
            className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Vendor
          </Link>
          <Link
            href="/host"
            className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Host
          </Link>
        </div>
      </section>

      <style jsx global>{`
        @keyframes sparkle {
          0%   { background-color: #f00; opacity: 0.8; }
          33%  { background-color: #fff; opacity: 1; }
          66%  { background-color: #00f; opacity: 0.9; }
          100% { background-color: #f00; opacity: 0.8; }
        }

        .universe {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .stars {
          position: absolute;
          inset: 0;
          background: transparent;
        }

        /* generate twinkling stars */
        .stars::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(2px 2px at 20% 30%, white 100%, transparent 0),
            radial-gradient(2px 2px at 60% 50%, white 100%, transparent 0),
            radial-gradient(2px 2px at 80% 70%, white 100%, transparent 0),
            radial-gradient(2px 2px at 40% 80%, white 100%, transparent 0),
            radial-gradient(2px 2px at 70% 20%, white 100%, transparent 0);
          background-size: 200px 200px;
          animation: sparkle 3s infinite alternate;
        }

        .galaxy-glow {
          position: absolute;
          inset: -20vmin;
          background:
            radial-gradient(60vmin 40vmin at 60% 45%, rgba(120, 84, 255, 0.22), transparent 55%),
            radial-gradient(80vmin 56vmin at 40% 55%, rgba(40, 180, 255, 0.16), transparent 60%);
          filter: blur(14px) saturate(120%);
        }
      `}</style>
    </main>
  );
}