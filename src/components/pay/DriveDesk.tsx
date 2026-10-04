"use client";

import { useEffect, useState } from "react";
import { PhoneOtp } from "@/components/auth/PhoneOtp";
import { formatInr } from "@/lib/validation";

type RequestRow = {
  id: string;
  passenger: string;
  destination: string;
  seats: number;
  amount: number;
};

export function DriveDesk() {
  const [mode, setMode] = useState<"checking" | "otp" | "desk">("checking");
  const [driverName, setDriverName] = useState("");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    const response = await fetch("/api/drive/cash");
    const payload = (await response.json().catch(() => null)) as { error?: string; driverName?: string; requests?: RequestRow[] } | null;
    if (response.status === 401) {
      setMode("otp");
      return;
    }
    if (!response.ok) {
      setError(payload?.error ?? "Cash requests could not be loaded.");
      setMode("desk");
      setRequests([]);
      return;
    }
    setError("");
    setDriverName(payload?.driverName ?? "");
    setRequests(payload?.requests ?? []);
    setMode("desk");
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, decision: "accept" | "decline") {
    setBusyId(id);
    setError("");
    const response = await fetch(`/api/drive/cash/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusyId("");
    if (!response.ok) {
      setError(payload?.error ?? "That decision could not be saved.");
      return;
    }
    setRequests((current) => current.filter((item) => item.id !== id));
  }

  if (mode === "checking") {
    return <p className="text-sm text-[#F6F1DC]/60">Checking your phone…</p>;
  }
  if (mode === "otp") {
    return (
      <div className="w-full max-w-md">
        <p className="mb-6 text-sm text-[#F6F1DC]/75">Sign in with the mobile number saved for you as a ROVEYA driver.</p>
        <PhoneOtp next="" onDone={() => load()} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold">Cash to accept</h1>
      <p className="mt-2 text-sm text-[#F6F1DC]/70">{driverName ? `${driverName}, these payments are waiting on your phone.` : "Payments waiting on this phone."}</p>
      {error ? <p className="mt-4 text-sm text-[#E0B23A]">{error}</p> : null}
      {requests.length === 0 ? <p className="mt-8 text-sm text-[#F6F1DC]/60">Nothing is waiting.</p> : null}
      <div className="mt-6 grid gap-4">
        {requests.map((item) => (
          <article key={item.id} className="rounded-3xl border border-[#D6A000]/25 bg-[#241018] p-5 text-left">
            <p className="text-3xl font-semibold text-[#E0B23A]">{formatInr(item.amount)}</p>
            <p className="mt-2 text-sm text-[#F6F1DC]/75">
              {item.passenger} · {item.destination} · {item.seats} seat{item.seats > 1 ? "s" : ""}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" disabled={busyId === item.id} onClick={() => void decide(item.id, "accept")} className="btn-primary py-3">
                Accept
              </button>
              <button type="button" disabled={busyId === item.id} onClick={() => void decide(item.id, "decline")} className="btn-ghost py-3">
                Decline
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
