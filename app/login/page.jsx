const origin = window.location.origin;
const pathname = window.location.pathname;
"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const supabase = getSupabase();
  const [busy, setBusy] = useState(false);

  // If already logged in, bounce to /referrer (you can change this)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = "/referrer";
      }
    })();
  }, [supabase]);

  async function signInGoogle() {
    try {
      setBusy(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}${pathname || "/referrer"}`,
          queryParams: { prompt: "select_account" },
        },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0b0b0b] text-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#1f3b2d] bg-[#0f1a14] p-6">
        <h1 className="text-2xl font-semibold mb-3">Sign in</h1>
        <p className="text-sm text-[#9adbb0] mb-6">
          Use Google to get into your CAPITALIZE dashboard.
        </p>
        <button
          onClick={signInGoogle}
          disabled={busy}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-3 font-semibold"
        >
          {busy ? "…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
