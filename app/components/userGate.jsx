"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function UserGate({ children, title = "Sign in to continue" }) {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // 1) Finalize session on first load (handles #access_token hash from Supabase)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // If we just came back from OAuth, the URL will have a hash with tokens.
        const hasHash =
          typeof window !== "undefined" &&
          window.location.hash &&
          /access_token=|refresh_token=/.test(window.location.hash);

        const { data: s } = await supabase.auth.getSession();
        if (!alive) return;

        setSession(s.session);
        setLoading(false);

        // Clean up the URL (remove the hash) once the session is stored
        if (hasHash && typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch {
        setLoading(false);
      }
    })();

    // Safety: never hang forever if something goes weird
    const t = setTimeout(() => alive && setLoading(false), 4000);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [supabase]);

  // 2) Keep session in sync with auth state changes
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setLoading(false);
    });
    return () => sub.subscription?.unsubscribe();
  }, [supabase]);

  async function signInWithGoogle() {
    setLoading(true);
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "";

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}${pathname || "/referrer"}`,
        queryParams: { prompt: "select_account" },
      },
    });
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

  // Signed in
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
