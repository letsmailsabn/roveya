"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/account";
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const supabase = createClient();

    if (mode === "register") {
      const mobile = String(form.get("mobile") ?? "").replace(/\D/g, "").slice(-10);
      const name = String(form.get("name") ?? "").trim();
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        setBusy(false);
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, mobile } },
      });
      setBusy(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (!result.data.session) {
        setInfo("Account created. Confirm the email if Supabase asks, then sign in.");
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const result = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <article className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="kicker">{mode === "login" ? "Welcome back" : "Join ROVEYA"}</p>
      <h1 className="display mt-3 text-5xl">{mode === "login" ? "Sign in" : "Create your account"}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {mode === "register" ? (
          <>
            <label className="block text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/70">
              Full name
              <input name="name" required className="mt-2 w-full rounded-xl border border-[#D6A000]/25 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC]" />
            </label>
            <label className="block text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/70">
              Mobile
              <input name="mobile" required inputMode="numeric" placeholder="10-digit mobile" className="mt-2 w-full rounded-xl border border-[#D6A000]/25 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC]" />
            </label>
          </>
        ) : null}
        <label className="block text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/70">
          Email
          <input name="email" type="email" required className="mt-2 w-full rounded-xl border border-[#D6A000]/25 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC]" />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/70">
          Password
          <input name="password" type="password" required minLength={6} className="mt-2 w-full rounded-xl border border-[#D6A000]/25 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC]" />
        </label>
        {error ? <p className="text-sm text-[#E0B23A]">{error}</p> : null}
        {info ? <p className="text-sm text-[#F6F1DC]/75">{info}</p> : null}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-[#F6F1DC]/65">
        {mode === "login" ? (
          <>
            New passenger? <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-[#D6A000]">Create an account</Link>
          </>
        ) : (
          <>
            Already registered? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[#D6A000]">Sign in</Link>
          </>
        )}
      </p>
    </article>
  );
}
