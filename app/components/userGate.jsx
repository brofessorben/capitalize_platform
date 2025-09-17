"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnon);

export default function UserGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const note = !session ? "no session" : "";

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session || null);
        setLoading(false);
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
        if (mounted) setSession(sess || null);
      });

      return () => {
        sub.subscription.unsubscribe();
      };
    }

    init();
    return () => {
      mounted = false;
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
        {process.env.NEXT_PUBLIC_DEBUG === "true" && note && (
          <div className="mb-3 text-[10px] opacity-60">debug: {note}</div>
        )}
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-2 text-xl font-semibold">Sign in to continue</h2>
          <p className="mb-4 text-sm opacity-80">
            Use your Google account to access your threads, events, and messages.
          </p>
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
            className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-black"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
