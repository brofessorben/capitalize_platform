// app/login/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = getSupabase();
  const [busy, setBusy] = useState(false);

  // If already logged in, bounce back to where they came from, or /referrer
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const pathname =
          typeof window !== "undefined" ? window.location.pathname : "/referrer";
        window.location.href = `${origin}${pathname || "/referrer"}`;
      }
    })();
  }, [supabase]);

  async function signInGoogle() {
    try {
      setBusy(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const pathname =
        typeof window !== "undefined" ? window.location.pathname : "/referrer";

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}${pathname || "/referrer"}`, // dynamic redirect back
          queryParams: { prompt: "select_account" },
        },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center text-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
        <h1 className="text-2xl font-semibold mb-3">Sign in</h1>
        <p className="text-sm text-white/70 mb-6">
          Use Google to get into your CAPITALIZE dashboard.
        </p>
        <button
          onClick={signInGoogle}
          disabled={busy}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 px-4 py-3 font-semibold text-black"
        >
          {busy ? "…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
