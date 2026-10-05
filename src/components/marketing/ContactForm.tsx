"use client";

import { useState } from "react";

export function ContactForm({ intro = false }: { intro?: boolean }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Unable to send your message.");
      return;
    }
    setStatus("sent");
    form.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-[28px] border border-[#D6A000]/25 bg-[#241018] p-6 sm:p-8 ${status === "sent" ? "flex h-full items-center justify-center" : ""}`}
    >
      {intro && status !== "sent" ? (
        <div className="mb-6">
          <p className="kicker">Write to the desk</p>
          <h2 className="display mt-3 text-4xl">Send a message</h2>
          <p className="mt-3 text-sm leading-6 text-[#F6F1DC]/65">
            Your name, a mobile number, and a short note. The desk will contact you during desk hours.
          </p>
        </div>
      ) : null}
      {status === "sent" ? (
        <div role="status" className="w-full rounded-2xl border border-[#D6A000]/40 bg-[#12060D] px-5 py-8 text-center">
          <p className="kicker">Confirmation</p>
          <h2 className="display mt-3 text-4xl">Your message has been sent.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#F6F1DC]/75">
            A representative of the ROVEYA desk will contact you on the mobile number you provided, during desk hours.
          </p>
          <button type="button" onClick={() => setStatus("idle")} className="btn-primary mt-8">
            SEND ANOTHER MESSAGE
          </button>
        </div>
      ) : null}
      {status === "sent" ? null : (
      <>
      <label className="block text-xs tracking-[0.16em] text-[#F6F1DC]/70 uppercase">
        Name *
        <input
          required
          name="name"
          placeholder="Your full name"
          className="mt-2 w-full rounded-xl border border-[#D6A000]/30 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC] outline-none focus:border-[#D6A000]"
          autoComplete="name"
        />
      </label>
      <label className="mt-4 block text-xs tracking-[0.16em] text-[#F6F1DC]/70 uppercase">
        Mobile *
        <div className="mt-2 flex overflow-hidden rounded-xl border border-[#D6A000]/30 bg-[#12060D] focus-within:border-[#D6A000]">
          <span className="px-3 py-3 text-sm text-[#F6F1DC]/55">+91</span>
          <input
            required
            name="mobile"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            className="w-full bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC] outline-none"
            placeholder="XXXXX XXXXX"
            autoComplete="tel"
          />
        </div>
      </label>
      <label className="mt-4 block text-xs tracking-[0.16em] text-[#F6F1DC]/70 uppercase">
        Email
        <input
          name="email"
          type="email"
          placeholder="Optional"
          className="mt-2 w-full rounded-xl border border-[#D6A000]/30 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC] outline-none focus:border-[#D6A000]"
          autoComplete="email"
        />
      </label>
      <label className="mt-4 block text-xs tracking-[0.16em] text-[#F6F1DC]/70 uppercase">
        Message *
        <textarea
          required
          name="message"
          rows={5}
          placeholder="A seat, a route, or a ride already moving"
          className="mt-2 w-full rounded-xl border border-[#D6A000]/30 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC] outline-none focus:border-[#D6A000]"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-[#E0B23A]">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary mt-6 w-full disabled:opacity-60"
      >
        {status === "sending" ? "SENDING…" : "SEND MESSAGE"}
      </button>
      </>
      )}
    </form>
  );
}
