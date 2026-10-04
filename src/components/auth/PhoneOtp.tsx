"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function PhoneOtp({ next = "/account", onDone }: { next?: string; onDone?: () => void }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const result = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSent(true);
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const result = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token: code, type: "sms" });
    setBusy(false);
    if (result.error || !result.data.user) {
      setError(result.error?.message ?? "That code was not accepted.");
      return;
    }
    await supabase.from("customer_profiles").upsert(
      { auth_user_id: result.data.user.id, name: "Traveller", mobile: phone },
      { onConflict: "auth_user_id", ignoreDuplicates: true },
    );
    onDone?.();
    router.push(next);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={sendCode} className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/70">
          Mobile number
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10-digit mobile"
            className="mt-2 w-full rounded-xl border border-[#E0B23A] bg-[#2A1020] px-4 py-3 text-sm text-[#F6F1DC]"
            required
          />
        </label>
        <button disabled={busy || phone.length !== 10} className="btn-primary w-full">
          {busy && !sent ? "Sending…" : "Send OTP"}
        </button>
      </form>
      {sent ? (
        <form onSubmit={verifyCode} className="space-y-3">
          <p className="text-sm text-[#F6F1DC]/75">Enter the OTP sent to +91 {phone}.</p>
          <label className="block text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/70">
            OTP
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="mt-2 w-full rounded-xl border border-[#E0B23A] bg-[#2A1020] px-4 py-3 text-sm tracking-[0.3em] text-[#F6F1DC]"
              required
            />
          </label>
          <button disabled={busy || code.length !== 6} className="btn-primary w-full">
            {busy ? "Checking…" : "Verify OTP"}
          </button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-[#E0B23A]">{error}</p> : null}
    </div>
  );
}
