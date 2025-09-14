"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

/**
 * UserGate
 * - If signed in: renders children
 * - If signed out: shows a simple Google sign-in screen
 * - Robust against stuck "Checking session…" after account switches
 */
export default function UserGate({ children, title = "Sign in to continue" }) {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Load session once and subscribe to changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setSession(data.session ?? null);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!cancelled) {
        setSession(sess);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  async function signInWithGoogle() {
    // Compute where to land after Google -> back to the page the user clicked from
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const path =
      typeof window !== "undefined" ? window.location.pathname : "";
    const redirectTo = `${origin}${path || "/referrer"}`;

    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" }, // force account picker
      },
    });
    // NOTE: we don't setLoading(false) here; browser navigates to Google.
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-sm text-neutral-300">
        Checking session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 text-white">
          <div className="text-xl font-semibold mb-2">{title}</div>
          <p className="text-neutral-300 text-sm mb-6">
            Use your Google account to access your threads, events, and messages.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 font-semibold"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // Signed in → show gated content and a tiny account bar
  return (
    <div className="min-h-[60vh]">
      <div className="flex items-center justify-end gap-3 px-4 py-2 text-xs text-neutral-300">
        <span className="truncate max-w-[40ch]">
          {session.user?.email || session.user?.id}
        </span>
        <button
          onClick={signOut}
          className="rounded-lg border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
          title="Sign out"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
