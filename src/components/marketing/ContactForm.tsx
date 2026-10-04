"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
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
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-5 sm:p-7">
      <label className="block text-xs tracking-[0.16em] uppercase">
        Name *
        <input
          required
          name="name"
          className="mt-2 w-full rounded-xl border border-[#D6A000]/20 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC]"
          autoComplete="name"
        />
      </label>
      <label className="mt-4 block text-xs tracking-[0.16em] uppercase">
        Mobile *
        <div className="mt-2 flex overflow-hidden rounded-xl border border-[#D6A000]/20 bg-[#12060D]">
          <span className="bg-[#2A1220] px-3 py-3 text-sm text-[#F6F1DC]/70">+91</span>
          <input
            required
            name="mobile"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            className="w-full bg-transparent px-4 py-3 text-sm text-[#F6F1DC]"
            placeholder="XXXXX XXXXX"
            autoComplete="tel"
          />
        </div>
      </label>
      <label className="mt-4 block text-xs tracking-[0.16em] uppercase">
        Email
        <input name="email" type="email" className="mt-2 w-full rounded-xl border border-[#D6A000]/20 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC]" autoComplete="email" />
      </label>
      <label className="mt-4 block text-xs tracking-[0.16em] uppercase">
        Message *
        <textarea required name="message" rows={5} className="mt-2 w-full rounded-xl border border-[#D6A000]/20 bg-[#12060D] px-4 py-3 text-sm text-[#F6F1DC]" />
      </label>
      {error ? <p className="mt-3 text-sm text-[#E0B23A]">{error}</p> : null}
      {status === "sent" ? <p className="mt-3 text-sm text-[#F6F1DC]/70">Thank you. We will get back to you shortly.</p> : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary mt-6 w-full disabled:opacity-60"
      >
        {status === "sending" ? "SENDING…" : "SEND MESSAGE"}
      </button>
    </form>
  );
}
