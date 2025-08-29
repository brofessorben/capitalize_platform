import "../globals.css";
import Link from "next/link";

export default function DashLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-gray-900">
        <header className="border-b">
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-black tracking-tight text-xl">CAPITALIZE</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/referrer" className="hover:underline">Referrer</Link>
              <Link href="/vendor" className="hover:underline">Vendor</Link>
              <Link href="/host" className="hover:underline">Host</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
