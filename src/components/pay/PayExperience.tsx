"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnalyticsPing, track } from "@/components/analytics/track";
import { Logo } from "@/components/brand/Logo";
import { formatInr } from "@/lib/validation";

type Destination = { id: string; name: string; farePerSeat: number };
type Step = "loader" | "form" | "method" | "online" | "cash" | "success" | "thanks";

type RideView = {
  publicId: string;
  customerName: string;
  mobile: string;
  seats: number;
  destinationName: string;
  farePerSeat: number;
  totalFare: number;
  paymentMethod: "RAZORPAY" | "CASH" | null;
  paymentStatus: string;
  razorpayOrderId?: string | null;
  keyId?: string | null;
};

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

const indianMobile = /^[6-9]\d{9}$/;

export function PayExperience({ destinations, driverId }: { destinations: Destination[]; driverId?: string }) {
  const [step, setStep] = useState<Step>("loader");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [seats, setSeats] = useState(1);
  const [destinationId, setDestinationId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ride, setRide] = useState<RideView | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setStep("form"), 1600);
    return () => clearTimeout(timer);
  }, []);

  const destination = destinations.find((d) => d.id === destinationId);
  const liveTotal = useMemo(() => (destination ? destination.farePerSeat * seats : 0), [destination, seats]);
  const phoneOk = mobile.length === 0 || indianMobile.test(mobile);
  const valid = name.trim().length >= 2 && phoneOk && seats >= 1 && Boolean(destinationId);

  useEffect(() => {
    if (!ride?.publicId || (step !== "online" && step !== "cash")) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/rides/${ride.publicId}`);
      if (!res.ok) return;
      const data = await res.json();
      setRide((prev) => (prev ? { ...prev, ...data } : data));
      if (data.paymentStatus === "PAID") {
        track("payment_completed");
        setStep("success");
      } else if (step === "cash" && data.paymentStatus === "FAILED") {
        setError("This cash payment was not recorded.");
        setStep("method");
      }
    }, 2500);
    return () => clearInterval(id);
  }, [ride?.publicId, step]);

  async function generate() {
    if (!valid) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile, seats, destinationId, driverId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to create ride.");
      return;
    }
    setRide(data);
    setStep("method");
  }

  async function openRazorpay(data: RideView) {
    const ready = await loadRazorpay();
    if (!ready || !data.razorpayOrderId || !data.keyId || !window.Razorpay) {
      setError("Online payment is unavailable right now.");
      return;
    }
    const checkout = new window.Razorpay({
      key: data.keyId,
      order_id: data.razorpayOrderId,
      name: "ROVEYA",
      description: `${data.destinationName} · ${data.seats} seat${data.seats > 1 ? "s" : ""}`,
      prefill: {
        name: data.customerName,
        contact: data.mobile ? `+91${data.mobile.replace(/\D/g, "").slice(-10)}` : undefined,
      },
      theme: { color: "#6B1838" },
      config: {
        display: {
          blocks: {
            intent: {
              name: "Google Pay or PhonePe",
              instruments: [{ method: "upi", flows: ["intent"] }],
            },
            qr: {
              name: "UPI QR",
              instruments: [{ method: "upi", flows: ["qr"] }],
            },
            card: {
              name: "Card",
              instruments: [{ method: "card" }],
            },
          },
          sequence: ["block.intent", "block.qr", "block.card"],
          preferences: { show_default_blocks: false },
        },
      },
      handler: async (response: RazorpaySuccess) => {
        const verified = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: data.publicId, ...response }),
        });
        const body = await verified.json();
        if (!verified.ok || body.paymentStatus !== "PAID") {
          setError(body.error ?? "Payment could not be verified.");
          return;
        }
        track("payment_completed");
        setRide((prev) => (prev ? { ...prev, ...body, paymentStatus: "PAID" } : prev));
        setStep("success");
      },
    });
    checkout.on("payment.failed", () => {
      setError("Payment was not completed.");
    });
    checkout.open();
  }

  async function choose(method: "ONLINE" | "CASH") {
    if (!ride) return;
    setBusy(true);
    setError("");
    if (method === "CASH") {
      const res = await fetch(`/api/rides/${ride.publicId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(data.error ?? "Unable to start payment.");
        return;
      }
      setRide(data);
      setStep("cash");
      return;
    }

    const res = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: ride.publicId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to start payment.");
      return;
    }
    setRide(data);
    setStep("online");
    await openRazorpay(data);
  }

  async function slideCash() {
    if (!ride) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/rides/${ride.publicId}/cash`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "The cash payment could not be recorded.");
      return;
    }
    track("payment_completed");
    setRide((prev) => (prev ? { ...prev, ...data, paymentStatus: "PAID" } : prev));
    setStep("success");
  }

  async function submitFeedback() {
    if (!ride || rating < 1) return;
    setBusy(true);
    await fetch(`/api/rides/${ride.publicId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, feedback }),
    });
    setBusy(false);
    setStep("thanks");
  }

  const mobileShown = mobile.length > 5 ? `${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <AnalyticsPing event="payment_page_opened" />
      {step !== "loader" ? (
        <div className="flex justify-center py-5">
          <Logo href="/" />
        </div>
      ) : null}

      {step === "loader" ? <Loader /> : null}

      {step === "form" && destinations.length === 0 ? (
        <section className="pt-8 text-center">
          <h1 className="display text-4xl">Pay for your ride</h1>
          <p className="mt-4 text-sm text-[#F6F1DC]/60">Ride payment is not available until destinations are connected.</p>
        </section>
      ) : null}

      {step === "form" && destinations.length > 0 ? (
        <section className="pb-28">
          <p className="kicker text-center">ROVEYA</p>
          <h1 className="display mt-2 text-center text-4xl">Pay for your ride</h1>
          <p className="mt-2 text-center text-sm text-[#F6F1DC]/55">You are already travelling. Enter your name. A mobile number is optional.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void generate();
            }}
          >
            <Field label="Full name *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-2xl bg-[#2A1220] text-[#F6F1DC] px-4 py-4 text-base"
                autoComplete="name"
                autoCapitalize="words"
                required
              />
            </Field>
            <Field label="Mobile number">
              <div className="flex overflow-hidden rounded-2xl bg-[#2A1220] text-[#F6F1DC]">
                <span className="px-3 py-4 text-base text-[#F6F1DC]/50">+91</span>
                <input
                  value={mobileShown}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Optional"
                  inputMode="numeric"
                  className="w-full bg-transparent py-4 pr-4 text-base"
                  autoComplete="tel"
                  aria-invalid={mobile.length > 0 && !indianMobile.test(mobile)}
                />
              </div>
            </Field>
            <Field label="Number of seats *">
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setSeats(n)}
                    className={`min-h-12 rounded-2xl text-base font-semibold ${
                      seats === n ? "bg-[#6B1838] text-[#F6F1DC]" : "bg-[#2A1220] text-[#F6F1DC]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#F6F1DC]/50">Seats means passengers being paid for.</p>
            </Field>
            <Field label="Destination *">
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full rounded-2xl bg-[#2A1220] text-[#F6F1DC] px-4 py-4 text-base"
                required
              >
                <option value="">Select destination</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="rounded-3xl bg-[#4C102C] p-5 text-[#F6F1DC]">
              <p className="kicker">Live total</p>
              <dl className="mt-3 space-y-2 text-sm">
                <Row k="Fare per seat" v={destination ? formatInr(destination.farePerSeat) : "—"} />
                <Row k="Number of seats" v={String(seats)} />
                <div className="h-px bg-[#D6A000]/50" />
                <Row k="Total" v={formatInr(liveTotal)} strong />
              </dl>
            </div>

            <div className="rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-5">
              <p className="kicker">Ride summary</p>
              <dl className="mt-3 space-y-2 text-sm">
                <Row k="Name" v={name || "—"} dark />
                <Row k="Mobile" v={mobile ? `+91 ${mobileShown}` : "—"} dark />
                <Row k="Seats" v={String(seats)} dark />
                <Row k="Destination" v={destination?.name ?? "—"} dark />
                <Row k="Fare per seat" v={destination ? formatInr(destination.farePerSeat) : "—"} dark />
                <Row k="Total" v={formatInr(liveTotal)} dark strong />
              </dl>
            </div>

            {error ? <p className="text-sm text-[#E0B23A]">{error}</p> : null}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#D6A000]/20 bg-[#12060D]/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
              <button type="submit" disabled={!valid || busy} className="btn-primary w-full py-4">
                {busy ? "PLEASE WAIT…" : "CONTINUE TO PAYMENT"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {step === "method" && ride ? (
        <section className="pb-10 text-center">
          <h1 className="display text-4xl">Choose payment</h1>
          <p className="mt-2 text-sm text-[#F6F1DC]/55">
            {ride.destinationName} · {ride.seats} seat{ride.seats > 1 ? "s" : ""} · {formatInr(ride.totalFare)}
          </p>
          {error ? <p className="mt-3 text-sm text-[#E0B23A]">{error}</p> : null}
          <div className="mt-8 grid gap-3">
            <button type="button" disabled={busy} onClick={() => void choose("ONLINE")} className="btn-primary w-full py-4">
              GOOGLE PAY
            </button>
            <button type="button" disabled={busy} onClick={() => void choose("ONLINE")} className="btn-primary w-full py-4">
              PHONEPE
            </button>
            <button type="button" disabled={busy} onClick={() => void choose("ONLINE")} className="btn-ghost w-full py-4">
              UPI QR
            </button>
            <p className="text-xs text-[#F6F1DC]/55">
              On a phone, Google Pay and PhonePe open in the app. On a computer, Razorpay shows the UPI QR.
            </p>
            <button type="button" disabled={busy} onClick={() => void choose("CASH")} className="btn-ghost w-full py-4">
              PAY CASH
            </button>
          </div>
        </section>
      ) : null}

      {step === "online" && ride ? (
        <section className="pb-10 text-center">
          <p className="kicker">ROVEYA payment</p>
          <h1 className="display mt-2 text-5xl">{formatInr(ride.totalFare)}</h1>
          <p className="mt-1 text-sm text-[#F6F1DC]/55">
            {ride.destinationName} · {ride.seats} seat{ride.seats > 1 ? "s" : ""}
          </p>
          <p className="mt-6 text-sm text-[#F6F1DC]/68">Choose UPI, then Google Pay, PhonePe, or the QR.</p>
          {error ? <p className="mt-3 text-sm text-[#E0B23A]">{error}</p> : null}
          <button type="button" className="btn-primary mt-6 w-full py-4" onClick={() => void openRazorpay(ride)}>
            OPEN UPI
          </button>
          <p className="mt-6 text-xs tracking-[0.16em] text-[#E0B23A]">WAITING FOR PAYMENT VERIFICATION</p>
        </section>
      ) : null}

      {step === "cash" && ride ? (
        <section className="pb-10 text-center">
          <p className="kicker">Cash payment</p>
          <h1 className="display mt-3 text-4xl">Amount due</h1>
          <p className="mt-2 text-5xl font-semibold text-[#E0B23A]">{formatInr(ride.totalFare)}</p>
          <p className="mt-4 text-sm text-[#F6F1DC]/68">Hand this amount to the driver, then slide to record the payment.</p>
          {error ? <p className="mt-3 text-sm text-[#E0B23A]">{error}</p> : null}
          <CashSlide busy={busy} onConfirm={() => void slideCash()} />
        </section>
      ) : null}

      {step === "success" && ride ? (
        <section className="pb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#6B1838] text-2xl text-[#F6F1DC]">
            ✓
          </div>
          <h1 className="display mt-5 text-4xl">Payment successful</h1>
          <dl className="mt-6 space-y-2 text-sm">
            <Row k="Amount" v={formatInr(ride.totalFare)} dark />
            <Row k="Ride ID" v={ride.publicId} dark />
            <Row k="Destination" v={ride.destinationName} dark />
            <Row k="Seats" v={String(ride.seats)} dark />
          </dl>
          <h2 className="display mt-10 text-2xl">How was your ride?</h2>
          <div className="mt-4 flex justify-center gap-2" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star`}
                onClick={() => setRating(n)}
                className={`text-3xl ${rating >= n ? "text-[#D6A000]" : "text-[#F6F1DC]/25"}`}
              >
                ★
              </button>
            ))}
          </div>
          <label className="mt-5 block text-left text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/60">
            Tell us about your experience
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional"
              className="mt-2 w-full rounded-2xl bg-[#2A1220] text-[#F6F1DC] px-4 py-3 text-sm normal-case tracking-normal"
              rows={4}
            />
          </label>
          <button type="button" disabled={rating < 1 || busy} onClick={() => void submitFeedback()} className="btn-primary mt-4 w-full py-4">
            SUBMIT FEEDBACK
          </button>
        </section>
      ) : null}

      {step === "thanks" ? (
        <section className="pt-10 text-center">
          <h1 className="display text-4xl">Thank you for travelling with ROVEYA.</h1>
          <p className="mt-4 text-sm text-[#F6F1DC]/60">We hope your next journey is just as easy.</p>
        </section>
      ) : null}
    </div>
  );
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CashSlide({ busy, onConfirm }: { busy: boolean; onConfirm: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const sent = useRef(false);
  const place = useRef(0);
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState(false);

  function limit() {
    return Math.max((track.current?.clientWidth ?? 0) - 64, 0);
  }

  function finish(next: number) {
    const end = limit();
    if (next < end - 6) {
      setOffset(0);
      return;
    }
    setOffset(end);
    setDone(true);
    if (!sent.current) {
      sent.current = true;
      onConfirm();
    }
  }

  function pointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (done || busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (done || busy || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = track.current?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(Math.max(event.clientX - rect.left - 32, 0), limit());
    place.current = next;
    setOffset(next);
  }

  function pointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (done || busy) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    finish(place.current);
  }

  return (
    <div ref={track} className="relative mx-auto mt-8 h-16 w-full overflow-hidden rounded-full bg-[#2A1220]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-[0.16em] text-[#F6F1DC]/70 uppercase">
        {done ? "Recording cash" : "Slide after you pay"}
      </div>
      <button
        type="button"
        aria-label="Slide to confirm the cash payment"
        disabled={done || busy}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        style={{ transform: `translateX(${offset}px)` }}
        className="absolute top-1 left-1 flex h-14 w-14 touch-none items-center justify-center rounded-full bg-[#D6A000] text-2xl text-[#12060D] disabled:opacity-80"
      >
        ›
      </button>
    </div>
  );
}

function Loader() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#12060D] px-6">
      <div className="flex w-full max-w-xs flex-col items-center text-center">
        <Logo href="" />
        <div className="mt-12 w-full">
          <div className="pay-car mx-auto w-16 text-[#D6A000]" aria-hidden>
            <svg viewBox="0 0 64 28" className="h-10 w-16 fill-current">
              <path d="M8 20h4l4-8h20l6 8h6c2 0 4 2 4 4v1H4v-1c0-2 2-4 4-4Zm14-8 2-5h10l3 5H22Z" />
              <circle cx="18" cy="24" r="3" />
              <circle cx="46" cy="24" r="3" />
            </svg>
          </div>
          <div className="road-dash mx-auto mt-2 h-0.5 w-full rounded-full" />
        </div>
        <p className="mt-8 text-sm text-[#F6F1DC]/60">Preparing your ride payment…</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/70">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Row({ k, v, strong, dark }: { k: string; v: string; strong?: boolean; dark?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${dark ? "text-[#F6F1DC]" : ""}`}>
      <dt className={strong ? "font-semibold" : "text-current/70"}>{k}</dt>
      <dd className={strong ? "text-lg font-semibold" : "font-medium"}>{v}</dd>
    </div>
  );
}
