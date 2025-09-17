"use client";

import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

const supabase: SupabaseClient | null =
  URL && ANON
    ? createClient(URL, ANON, {
        auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
      })
    : null;

export default function UserGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  // Fire-and-forget auth bootstrap. NO loading gate — UI never blocks.
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!supabase) return;

      // If we’re returning from Google (?code=…), exchange it — but do NOT block UI.
      try {
        const qs = window.location.search || "";
        if (/[?&]code=/.test(qs) && /[?&]state=/.test(qs)) {
          await supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {});
          // Clean URL so it doesn't re-trigger
          const clean = stripParams(["code", "state"]);
          window.history.replaceState({}, "", clean);
        }
      } catch {}

      // Get whatever session exists right now
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        setSession(data?.session ?? null);
      });

      // Keep listening — when OAuth completes, this fires and we update
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
        if (!mounted) return;
        setSession(sess ?? null);
      });

      return () => sub.subscription.unsubscribe();
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------- Views ----------
  if (!supabase) {
    // Clear error if client can’t be created
    return (
      <div className="mx-auto grid min-h-[80vh] max-w-lg place-items-center p-6">
        <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="mb-2 text-xl font-semibold">Configuration error</h2>
          <p className="text-sm opacity-90">
            Missing <code>NEXT_PUBLIC_SUPABASE_URL</code> or <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Not signed in → show login card immediately (no spinner).
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center p-6">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-2 text-xl font-semibold">Sign in to continue</h2>
          <p className="mb-4 text-sm opacity-80">
            Use your Google account to access your threads, events, and messages.
          </p>
          <button
            type="button"
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
              })
            }
            className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-black"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // Signed in → top bar + children
  const email = session.user?.email || "Signed in";
  return (
    <>
      <header className="sticky top-0 z-20 mb-4 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm">
          <div className="font-semibold tracking-wide">CAPITALIZE</div>
          <nav className="hidden gap-4 md:flex opacity-80">
            <a href="/referrer" className="hover:opacity-100">Referrer</a>
            <a href="/vendor" className="hover:opacity-100">Vendor</a>
            <a href="/host" className="hover:opacity-100">Host</a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="opacity-85">{email}</span>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.assign("/");
              }}
              className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}

// Remove specific query params from current URL
function stripParams(keys: string[]): string {
  const href = window.location.href;
  const q = href.indexOf("?");
  if (q === -1) return href;
  const base = href.slice(0, q);
  const search = href.slice(q + 1);
  const kept = search
    .split("&")
    .filter(Boolean)
    .filter((pair) => !keys.includes(decodeURIComponent(pair.split("=")[0] || "")));
  return kept.length ? `${base}?${kept.join("&")}` : base;
}
