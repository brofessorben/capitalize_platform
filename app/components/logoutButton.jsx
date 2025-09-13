"use client";

import React, { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await getSupabase().auth.signOut();
      window.location.href = "/login";
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={signOut}
      disabled={busy}
      className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-sm hover:bg-[#1b1b1b] disabled:opacity-60"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}
