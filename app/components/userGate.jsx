"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

/**
 * UserGate
 * - If signed in: renders children
 * - If signed out: shows a simple Google sign-in screen
 */
export default function UserGate({ children, title = "Sign in to continue" }) {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // get current session
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
    });

    // listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  async function signInWithGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/`
            : undefined,
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

  // Signed in → show the gated content + a tiny account bar
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
