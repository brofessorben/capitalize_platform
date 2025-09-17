"use client";

import React, { useEffect, useState } from "react";
import {
  createClient,
  SupabaseClient,
  Session,
} from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Guard: if envs are missing, don't create a broken client
let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
}

export default function UserGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fatal, setFatal] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeout: number | undefined;

    async function init() {
      try {
        // Hard stop: never allow permanent spinner
        timeout = window.setTimeout(() => {
          if (mounted) setLoading(false);
        }, 2500);

        if (!supabase) {
          setFatal(
            "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
          );
          setLoading(false);
          return;
        }

        // 1) First, try to read any existing session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("getSession error:", error.message);
        }
        if (!mounted) return;

        setSession(data?.session ?? null);
        setLoading(false);

        // 2) Listen for auth changes (covers the OAuth redirect)
        const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
          if (!mounted) return;
          setSession(sess ?? null);
          setLoading(false);
        });

        // Cleanup
        return () => {
          sub.subscription.unsubscribe();
        };
      } catch (e: any) {
        console.error("UserGate init error:", e?.message || e);
        if (mounted) {
          setFatal("Auth init failed. See console.");
          setLoading(false);
        }
      } finally {
        if (timeout) window.clearTimeout(timeout);
      }
    }

    void init();

    return () => {
      mounted = false;
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  // ---- UI states ----
  if (fatal) {
    return (
      <div className="mx-auto grid min-h-[80vh] max-w-lg place-items-center p-6">
        <div className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="mb-2 text-xl font-semibold">Configuration error</h2>
          <p className="text-sm opacity-90">{fatal}</p>
          <ul className="mt-3 list-disc pl-5 text-sm opacity-80">
            <li>Set env vars in Vercel:</li>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
          </ul>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm opacity-70">
        Loading…
      </div>
    );
  }

  if (!session) {
    // Not signed in → show login card (same background as app)
    return (
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
    );
  }

  const email = session.user?.email || "Signed in";

  return (
    <>
      <header className="sticky top-0 z-20 mb-4 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm">
          <div className="font-semibold tracking-wide">CAPITALIZE</div>
          <nav className="hidden gap-4 md:flex opacity-80">
            <a href="/referrer" className="hover:opacity-100">
              Referrer
            </a>
            <a href="/vendor" className="hover:opacity-100">
              Vendor
            </a>
            <a href="/host" className="hover:opacity-100">
              Host
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="opacity-85">{email}</span>
            <button
              type="button"
              onClick={async () => {
                if (!supabase) return;
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
