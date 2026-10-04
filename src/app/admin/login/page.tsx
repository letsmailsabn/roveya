"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to sign in");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="rounded-3xl bg-[#F9F7E2] p-8 shadow-[0_16px_40px_rgba(79,0,57,0.08)]">
        <Logo href="/" compact />
        <h1 className="mt-6 text-2xl font-semibold">Operations sign in</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-xs uppercase tracking-[0.16em]">
            Email
            <input name="email" type="email" required className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm" />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em]">
            Password
            <input name="password" type="password" required className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm" />
          </label>
          {error ? <p className="text-sm text-[#600042]">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#600042] py-3 text-xs font-semibold tracking-[0.16em] text-[#F9F7E2]"
          >
            {busy ? "SIGNING IN…" : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
