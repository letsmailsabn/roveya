"use client";

import { useSearchParams } from "next/navigation";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";

export function PhoneGate() {
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  return (
    <article className="mx-auto max-w-md px-5 py-20">
      <p className="kicker">Account</p>
      <h1 className="display mt-3 text-5xl">Sign in</h1>
      <p className="mt-4 text-sm leading-6 text-[#F6F1DC]/70">Use Google. Your name is taken from the account. A mobile number stays optional.</p>
      <div className="mt-8">
        <GoogleSignIn next={safeNext} />
      </div>
    </article>
  );
}
