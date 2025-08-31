"use client";
import Link from "next/link";

export default function LandingPage() {
  // we’ll render several comets with different sizes/delays/lanes
  const COMETS = Array.from({ length: 7 }).map((_, i) => {
    const size = [220, 260, 300, 360, 420, 500, 560][i % 7]; // tail length (px)
    const thickness = [3, 4, 5, 6, 7, 8, 9][i % 7];          // tail thickness (px)
    const duration = [14, 16, 18, 20, 22, 24, 26][i % 7];    // seconds
    const delay = i * 3;                                     // stagger
    const top = `${8 + i * 12}%`;                            // lanes down the screen
    return { size, thickness, duration, delay, top };
  });

  return (
    <main className="min-h-dvh text-gray-100 flex flex-col relative overflow-hidden">
      {/* Animated cosmic background */}
      <div className="absolute inset-0 bg-black">
        <div className="stars" />
        <div className="twinkling" />
        <div className="galaxy-glow" />
        <div className="comets">
          {COMETS.map((c, i) => (
            <span
              key={i}
              className="comet"
              style={{
                "--len": `${c.size}px`,
                "--thick": `${c.thickness}px`,
                "--dur": `${c.duration}s`,
                "--delay": `${c.delay}s`,
                "--laneTop": c.top,
              }}
            />
          ))}
        </div>
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

      {/* Styles */}
      <style jsx global>{`
        .stars, .twinkling, .galaxy-glow, .comets {
          position: absolute; inset: 0; width: 100%; height: 100%;
        }

        /* Starfield & drift (drifts left + down) */
        .stars {
          background: url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          opacity: 0.8;
          z-index: 0;
        }
        .twinkling {
          background: transparent url("https://www.transparenttextures.com/patterns/stardust.png") repeat;
          animation: move-twink 200s linear infinite;
          z-index: 1;
          opacity: 0.35;
          mix-blend-mode: screen;
        }
        .galaxy-glow {
          background: radial-gradient(circle at 50% 40%, rgba(160,80,255,0.35), rgba(0,0,0,0) 65%),
                      radial-gradient(circle at 70% 60%, rgba(255,120,180,0.25), rgba(0,0,0,0) 60%);
          animation: pulse 8s ease-in-out infinite;
          z-index: 2;
        }

        /* --- COMETS --- */
        .comets { z-index: 3; pointer-events: none; }

        .comet {
          position: absolute;
          top: var(--laneTop);
          right: -15vw;
          width: var(--len);
          height: var(--thick);
          transform: rotate(225deg); /* aiming left+down */
          border-radius: 9999px;
          background:
            linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 45%, #fff 60%, rgba(255,255,255,0) 100%);
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.9))
                  drop-shadow(0 0 24px rgba(180,140,255,0.7))
                  blur(0.2px);
          opacity: 0.95;
          animation: comet-fly var(--dur) linear var(--delay) infinite;
        }

        .comet::after {
          content: "";
          position: absolute;
          right: -6px;               /* head leads */
          top: 50%;
          transform: translateY(-50%);
          width: calc(var(--thick) * 2.4);
          height: calc(var(--thick) * 2.4);
          border-radius: 9999px;
          background: radial-gradient(circle, #fff, rgba(255,255,255,0.2) 60%, transparent 70%);
          filter: blur(1px) drop-shadow(0 0 18px rgba(255,255,255,0.85));
        }

        @keyframes comet-fly {
          0%   { transform: translate(0,0) rotate(225deg); opacity: 0; }
          5%   { opacity: 1; }
          100% { transform: translate(-140vw, 140vh) rotate(225deg); opacity: 0; }
        }

        @keyframes move-twink {
          from { background-position: 0 0; }
          to   { background-position: -10000px 5000px; } /* left + down */
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.65; }
          50%      { opacity: 0.95; }
        }
      `}</style>
    </main>
  );
}
