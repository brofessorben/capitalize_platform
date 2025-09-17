"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnon);

export default function UserGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // If OAuth returned an error in the URL, surface it
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDesc = params.get("error_description");
        if (errorDesc) console.warn("OAuth error:", decodeURIComponent(errorDesc));

        // Initial session fetch
        const { data } = await supabase.auth.getSession();
        if (mounted) setSession(data.session ?? null);

        // Auth state listener (handles OAuth return)
        const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
          if (!mounted) return;
          setSession(sess ?? null);
          setLoading(false);
        });

        // Safety: stop loading even if nothing fires (slow devices)
        timeoutRef.current = window.setTimeout(() => {
          if (mounted) setLoading(false);
        }, 3000);

        return () => {
          sub.subscription.unsubscribe();
        };
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm opacity-70">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center p-6">
        {process.env.NEXT_PUBLIC_DEBUG === "true" && (
          <div className="mb-3 text-[10px] opacity-60">debug: no session</div>
        )}
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
                options: {
                  redirectTo: window.location.origin + window.location.pathname, // come back to this page
                },
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

  const email = session.user?.email || "Signed in";

  return (
    <>
      {/* top bar */}
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
                window.location.assign("/"); // explicit after logout
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
