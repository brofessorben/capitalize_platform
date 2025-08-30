"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-white text-gray-900 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-black tracking-tight text-xl">
            CAPITALIZE
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/referrer" className="hover:underline">Referrer</Link>
            <Link href="/vendor" className="hover:underline">Vendor</Link>
            <Link href="/host" className="hover:underline">Host</Link>
            <a href="#how" className="hover:underline">How it Works</a>
            <a href="#roles" className="hover:underline">Roles</a>
            <a href="#features" className="hover:underline">Features</a>
            <a href="#faq" className="hover:underline">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/referrer"
              className="px-4 py-2 rounded-xl border hover:bg-black hover:text-white transition"
            >
              Start Referring
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="flex-1 bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="text-5xl font-extrabold">Connect. Refer. Get Paid.</h1>
          <p className="mt-6 text-lg text-gray-600 max-w-lg mx-auto">
            CAPITALIZE is the reverse-Amazon powered by people. Spot a host who needs a
            vendor, drop the lead, and our AI handles the rest — proposals, chat, and instant payouts.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/referrer" className="px-6 py-3 rounded-2xl bg-black text-white">
              Start Referring
            </Link>
            <Link href="/vendor" className="px-6 py-3 rounded-2xl border">
              Vendor Dashboard
            </Link>
            <Link href="/host" className="px-6 py-3 rounded-2xl border">
              Host Dashboard
            </Link>
            <a href="#features" className="px-6 py-3 rounded-2xl border">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-10 flex justify-between text-sm">
          <div className="font-semibold">CAPITALIZE</div>
          <div className="text-gray-500">Freedom • Joy • Growth</div>
          <div className="text-gray-500">© {new Date().getFullYear()} CAPITALIZE</div>
        </div>
      </footer>
    </main>
  );
}
