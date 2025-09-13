"use client";

import React, { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

/**
 * Shows children if logged in, otherwise shoves them to /login.
 * Use at the top of each dashboard page.
 */
export default function UserGate({ children }) {
  const supabase = getSupabase();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#c9fdd7]">
        Checking your session…
      </div>
    );
  }
  return <>{children}</>;
}
