"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      {/* Background universe layers */}
      <div className="universe pointer-events-none">
        {/* deep starfield */}
        <div className="stars stars--far" />
        {/* nearer starfield with twinkle */}
        <div className="stars stars--near" />
        {/* soft galactic glow */}
        <div className="galaxy-glow" />
        {/* the “Milky Way” texture, huge and slowly rotating */}
        <div className="galaxy-core" />
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

      {/* Page-local styles */}
      <style jsx global>{`
        /* --- Keyframes --- */
        @keyframes drift {
          0% { transform: translate3d(0, 0, 0) }
          50% { transform: translate3d(2%, -2%, 0) }
          100% { transform: translate3d(0, 0, 0) }
        }
        @keyframes rotate-slow {
          0% { transform: rotate(0deg) }
          100% { transform: rotate(360deg) }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.65 }
          50% { opacity: 1 }
        }

        /* --- Universe container --- */
        .universe {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        /* --- Starfields (no images, just gradients) --- */
        .stars {
          position: absolute;
          inset: -10vmin;
          background-repeat: repeat;
          animation: drift 32s ease-in-out infinite;
          opacity: 0.9;
          filter: drop-shadow(0 0 1px #fff);
        }
        /* far layer: tiny/soft stars */
        .stars--far {
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 50% 40%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 70% 10%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 90% 70%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 80% 30%, rgba(255,255,255,.7) 80%, transparent 81%),
            radial-gradient(1px 1px at 15% 60%, rgba(255,255,255,.7) 80%, transparent 81%);
          background-size: 200px 200px;
          transform: scale(1.1);
          opacity: 0.6;
          animation-duration: 60s;
        }
        /* near layer: denser stars with subtle twinkle */
        .stars--near {
          background-image:
            radial-gradient(1.2px 1.2px at 12% 25%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 44% 66%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 78% 18%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 6% 88%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 88% 82%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 62% 12%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 32% 8%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 20% 74%, rgba(255,255,255,.9) 80%, transparent 81%),
            radial-gradient(1.2px 1.2px at 70% 54%, rgba(255,255,255,.9) 80%, transparent 81%);
          background-size: 180px 180px;
          animation: drift 40s ease-in-out infinite, twinkle 3.8s ease-in-out infinite;
          opacity: 0.9;
          mix-blend-mode: screen;
        }

        /* --- Soft purple/blue galactic glow behind the core --- */
        .galaxy-glow {
          position: absolute;
          inset: -20vmin;
          background:
            radial-gradient(60vmin 40vmin at 60% 45%, rgba(120, 84, 255, 0.22), transparent 55%),
            radial-gradient(80vmin 56vmin at 40% 55%, rgba(40, 180, 255, 0.16), transparent 60%),
            radial-gradient(120vmin 90vmin at 50% 50%, rgba(110, 0, 160, 0.10), transparent 62%);
          filter: blur(14px) saturate(120%);
          animation: drift 50s ease-in-out infinite;
        }

        /* --- Milky Way “core” (big image, masked + animated) --- */
        .galaxy-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 160vmin;   /* huge so it fills most screens */
          height: 160vmin;
          transform: translate(-50%, -50%);
          /* use multiple backgrounds: texture + subtle noise to break banding */
          background-image:
            url("https://images.unsplash.com/photo-1475274222565-3e77c57eacb6?auto=format&fit=crop&w=2000&q=80"),
            radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,.05), rgba(0,0,0,.0));
          background-size: cover, 120% 120%;
          background-position: center, center;
          opacity: 0.75;
          mix-blend-mode: screen;

          /* fade the edges so it looks like a galaxy, not a hard square */
          -webkit-mask-image: radial-gradient(60% 45% at 50% 50%, black 55%, transparent 75%);
          mask-image: radial-gradient(60% 45% at 50% 50%, black 55%, transparent 75%);

          /* gentle rotation + micro drift for life */
          animation: rotate-slow 180s linear infinite, drift 90s ease-in-out infinite;
          will-change: transform;
        }

        /* Accessibility: prefer-reduced-motion users get a static sky */
        @media (prefers-reduced-motion: reduce) {
          .stars, .galaxy-glow, .galaxy-core { animation: none !important; }
        }
      `}</style>
    </main>
  );
}