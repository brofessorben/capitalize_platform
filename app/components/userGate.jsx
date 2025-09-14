"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function UserGate({ children, title = "Sign in to continue" }) {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [note, setNote] = useState(""); // tiny debug banner

  useEffect(() => {
    let mounted = true;

    async function boot() {
      // 1) first try: session right now
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        setSession(data.session);
        setLoading(false);
        setNote("session from getSession()");
        return;
      }

      // 2) wait for OAuth hash to be processed
      const { data: sub } = supabase.auth.onAuthStateChange((evt, sess) => {
        if (!mounted) return;
        if (sess) {
          setSession(sess);
          setLoading(false);
          setNote(`session via onAuthStateChange (${evt})`);
        }
      });

      // 3) fallback: small delay and try again (covers slow hash parsing)
      setTimeout(async () => {
        if (!mounted) return;
        const { data: d2 } = await supabase.auth.getSession();
        if (d2.session) {
          setSession(d2.session);
          setLoading(false);
          setNote("session after retry");
        } else {
          setLoading(false); // show login
          setNote("no session");
        }
      }, 400);

      return () => sub?.subscription?.unsubscribe();
    }

    boot();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function signInWithGoogle() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "/";

    // send user back to the page they were on
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}${pathname}`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    // hard refresh to clear any stale state
    if (typeof window !== "undefined") window.location.reload();
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
          {note && (
            <div className="mb-3 text-[10px] opacity-60">debug: {note}</div>
          )}
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
