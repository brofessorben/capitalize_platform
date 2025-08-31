"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      {/* Background universe layers */}
      <div className="universe pointer-events-none">
        <div className="stars stars--far" />
        <div className="stars stars--near" />
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
        @keyframes drift {
          0% { transform: translate3d(0, 0, 0) }
          50% { transform: translate3d(2%, -2%, 0) }
          100% { transform: translate3d(0, 0, 0) }
        }
        @keyframes sparkle {
          0% { opacity: 0.6; filter: drop-shadow(0 0 2px #f00); background-color: #f00; }
          33% { opacity: 1; filter: drop-shadow(0 0 3px #fff); background-color: #fff; }
          66% { opacity: 0.8; filter: drop-shadow(0 0 3px #00f); background-color: #00f; }
          100% { opacity: 0.6; filter: drop-shadow(0 0 2px #f00); background-color: #f00; }
        }

        .universe {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .stars {
          position: absolute;
          inset: -10vmin;
          background-repeat: repeat;
          animation: drift 32s ease-in-out infinite;
        }

        .stars--far,
        .stars--near {
          background-image:
            radial-gradient(1px 1px at 10% 20%, white 100%, transparent 0),
            radial-gradient(1px 1px at 30% 80%, white 100%, transparent 0),
            radial-gradient(1px 1px at 50% 40%, white 100%, transparent 0),
            radial-gradient(1px 1px at 70% 60%, white 100%, transparent 0),
            radial-gradient(1px 1px at 90% 10%, white 100%, transparent 0);
          background-size: 200px 200px;
          animation: drift 60s ease-in-out infinite;
        }

        .stars--near {
          background-size: 180px 180px;
          animation: drift 40s ease-in-out infinite;
        }

        /* Overlay actual twinkling sparkles */
        .stars--far::before,
        .stars--near::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1.5px 1.5px at 20% 30%, red 100%, transparent 0),
            radial-gradient(1.5px 1.5px at 60% 50%, white 100%, transparent 0),
            radial-gradient(1.5px 1.5px at 80% 70%, blue 100%, transparent 0);
          background-size: 200px 200px;
          animation: sparkle 4s linear infinite;
          mix-blend-mode: screen;
        }

        .galaxy-glow {
          position: absolute;
          inset: -20vmin;
          background:
            radial-gradient(60vmin 40vmin at 60% 45%, rgba(120, 84, 255, 0.22), transparent 55%),
            radial-gradient(80vmin 56vmin at 40% 55%, rgba(40, 180, 255, 0.16), transparent 60%);
          filter: blur(14px) saturate(120%);
          animation: drift 50s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .stars, .galaxy-glow { animation: none !important; }
        }
      `}</style>
    </main>
  );
}