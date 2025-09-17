"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Build client safely
let supabase: SupabaseClient | null = null;
if (URL && ANON) {
  supabase = createClient(URL, ANON, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });
}

export default function UserGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fatal, setFatal] = useState<string | null>(null);

  const debugMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URL(window.location.href).searchParams.get("debug") === "1";
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (!supabase) {
          setFatal(
            "Supabase env missing: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY."
          );
          return;
        }

        // 1) Handle OAuth return explicitly (prevents redirect loops)
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (code && state) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(
              url.toString()
            );
            if (debugMode) console.log("[Gate] exchanged code =>", error || "OK");
          } catch (e: any) {
            console.warn("[Gate] exchange error:", e?.message || e);
          } finally {
            // strip code/state so it won't retrigger
            url.searchParams.delete("code");
            url.searchParams.delete("state");
            window.history.replaceState({}, "", url.toString());
          }
        }

        // 2) Read current session
        const { data, error } = await supabase.auth.getSession();
        if (debugMode) console.log("[Gate] getSession:", { data, error });

        if (!mounted) return;
        setSession(data?.session ?? null);

        // 3) Subscribe to auth changes (token refresh / sign in / out)
        const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
          if (!mounted) return;
          if (debugMode) console.log("[Gate] onAuthStateChange:", _event, !!sess);
          setSession(sess ?? null);
        });

        // cleanup
        return () => sub.subscription.unsubscribe();
      } catch (e: any) {
        console.error("[Gate] init fatal:", e?.message || e);
        if (mounted) setFatal("Auth init failed — see console.");
      } finally {
        if (mounted) setLoading(false); // <- NEVER hang
      }
    }

    void init();
    return () => {
      mounted = false;
    };
  }, [debugMode]);

  // ---------- UI STATES ----------
  if (fatal) {
    return (
      <div className="mx-auto grid min-h-[80vh] max-w-lg place-items-center p-6">
        <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="mb-2 text-xl font-semibold">Configuration error</h2>
          <p className="text-sm opacity-90">{fatal}</p>
          <ul className="mt-3 list-disc pl-5 text-sm opacity-80">
            <li>Set envs in Vercel:</li>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
          </ul>
        </div>
      </div>
    );
  }

  // Small debug strip (only with ?debug=1)
  const DebugBar = () => {
    if (!debugMode) return null;
    const href =
      typeof window !== "undefined" ? window.location.href : "(ssr)";
    return (
      <div className="fixed bottom-2 left-2 z-50 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
        <div>debug: gate</div>
        <div>env URL:{String(!!URL)} ANON:{String(!!ANON)}</div>
        <div>session:{String(!!session)}</div>
        <div className="max-w-[60vw] truncate">{href}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <div className="grid min-h-[60vh] place-items-center text-sm opacity-70">
          Loading…
        </div>
        <DebugBar />
      </>
    );
  }

  if (!supabase || !session) {
    // Not signed in → login card
    return (
      <>
        <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center p-6">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-2 text-xl font-semibold">Sign in to continue</h2>
            <p className="mb-4 text-sm opacity-80">
              Use your Google account to access your threads, events, and messages.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!supabase) return;
                const backTo = `${window.location.origin}${window.location.pathname}`;
                supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: backTo },
                });
              }}
              className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-black"
            >
              Continue with Google
            </button>
          </div>
        </div>
        <DebugBar />
      </>
    );
  }

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
                await supabase!.auth.signOut();
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
      <DebugBar />
    </>
  );
}
