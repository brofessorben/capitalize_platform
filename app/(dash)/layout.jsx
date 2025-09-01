// app/(dash)/layout.jsx
import "../globals.css";
import Link from "next/link";

export default function DashLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-neutral-950 text-neutral-200">
        {/* Ambient glow background */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              `radial-gradient(600px circle at 20% 10%, rgba(120,119,198,0.35), transparent 60%),
               radial-gradient(500px circle at 80% 0%, rgba(214,188,250,0.25), transparent 60%),
               radial-gradient(900px circle at 50% 100%, rgba(34,197,94,0.12), transparent 60%)`,
            filter: "blur(40px)",
          }}
        />

        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/60 backdrop-blur">
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-black tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400">
                CAPITALIZE
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <NavLink href="/referrer" label="Referrer" />
              <NavLink href="/vendor" label="Vendor" />
              <NavLink href="/host" label="Host" />
            </nav>
          </div>
        </header>

        {/* CONTENT */}
        <main className="mx-auto max-w-7xl px-6 py-10">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="border-t border-neutral-900/70">
          <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-neutral-400 flex items-center justify-between">
            <div className="font-semibold">CAPITALIZE</div>
            <div className="opacity-75">Freedom • Joy • Growth</div>
            <div>© {new Date().getFullYear()}</div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-xl border border-neutral-800/80 bg-neutral-900/60 hover:bg-neutral-800 hover:border-neutral-700 transition text-sm"
    >
      {label}
    </Link>
  );
}