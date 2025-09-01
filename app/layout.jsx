"use client";
import "../globals.css";
import Link from "next/link";

export default function DashLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-neutral-100">
        <header className="border-b border-neutral-900 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50 sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-black tracking-tight text-xl text-white">CAPITALIZE</Link>
            <nav className="flex gap-3 text-sm">
              <Link href="/(dash)/referrer" className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-purple-500 hover:text-purple-300 transition">Referrer</Link>
              <Link href="/(dash)/vendor" className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-purple-500 hover:text-purple-300 transition">Vendor</Link>
              <Link href="/(dash)/host" className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-purple-500 hover:text-purple-300 transition">Host</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
