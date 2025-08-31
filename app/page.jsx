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
        @keyframes twinkle {
          0%, 100% { opacity: 0.65 }
          50% { opacity: 1 }
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
          filter: drop-shadow(0 0 1px #fff);
        }
        .stars--far {
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 50% 40%, rgba(255,255,255,.7) 80%, transparent 81%);
          background-size: 200px 200px;
          transform: scale(1.1);
          opacity: 0.6;
          animation-duration: 60s;
        }
        .stars--near {
          background-image:
            radial-gradient(1.2px 1.2px at 12% 25%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 44% 66%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 78% 18%, rgba(255,255,255,.9) 80%, transparent 81%);
          background-size: 180px 180px;
          animation: drift 40s ease-in-out infinite, twinkle 3.8s ease-in-out infinite;
          opacity: 0.9;
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