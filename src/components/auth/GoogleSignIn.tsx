"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function GoogleSignIn({ next = "/account", label = "Continue with Google" }: { next?: string; label?: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError("");
    const origin = window.location.origin;
    const result = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (result.error) {
      setBusy(false);
      setError(result.error.message);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void signIn()}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-[#F6F1DC] px-5 py-3 text-sm font-semibold text-[#12060D] disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z" />
          <path fill="#34A853" d="M12 24c3.2 0 5.8-1 7.7-2.8l-3.7-2.9c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.6v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.4 14.6A7.2 7.2 0 0 1 5 12c0-.9.2-1.8.4-2.6V6.3H1.6A12 12 0 0 0 0 12c0 1.9.5 3.8 1.6 5.7l3.8-3.1Z" />
          <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.8 1.1 15.2 0 12 0A12 12 0 0 0 1.6 6.3l3.8 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
        </svg>
        {busy ? "Opening Google…" : label}
      </button>
      {error ? <p className="text-sm text-[#E0B23A]">{error}</p> : null}
    </div>
  );
}
