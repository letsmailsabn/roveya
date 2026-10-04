"use client";

import { useState } from "react";
import { formatInr } from "@/lib/validation";

type CashPreview = {
  passenger: string;
  destination: string;
  seats: number;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
};

export function CashDecision({ token, cash }: { token: string; cash: CashPreview }) {
  const [status, setStatus] = useState(cash.status);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function choose(decision: "accept" | "decline") {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/cash/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; status?: CashPreview["status"] } | null;
    setBusy(false);
    if (!response.ok) {
      setError(payload?.error ?? "That decision could not be saved.");
      return;
    }
    setStatus(payload?.status ?? (decision === "accept" ? "ACCEPTED" : "DECLINED"));
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#12060D] px-5 py-10 text-center text-[#F6F1DC]">
      <p className="text-xs uppercase tracking-[0.22em] text-[#D6A000]">ROVEYA driver</p>
      <h1 className="mt-3 text-3xl font-semibold">Cash payment</h1>
      <p className="mt-6 text-5xl font-semibold text-[#E0B23A]">{formatInr(cash.amount)}</p>
      <p className="mt-4 text-sm text-[#F6F1DC]/75">
        {cash.passenger} · {cash.destination} · {cash.seats} seat{cash.seats > 1 ? "s" : ""}
      </p>
      {status === "PENDING" ? (
        <div className="mt-8 grid gap-3">
          <button type="button" disabled={busy} onClick={() => void choose("accept")} className="btn-primary w-full py-4">
            {busy ? "Saving…" : "Accept cash"}
          </button>
          <button type="button" disabled={busy} onClick={() => void choose("decline")} className="btn-ghost w-full py-4">
            This is not my ride
          </button>
        </div>
      ) : (
        <p className="mt-8 text-sm text-[#F6F1DC]/75">
          {status === "ACCEPTED"
            ? "Accepted. The payment is recorded."
            : status === "DECLINED"
              ? "Declined. The payment was not recorded."
              : "This request has expired."}
        </p>
      )}
      {error ? <p className="mt-4 text-sm text-[#E0B23A]">{error}</p> : null}
    </main>
  );
}
