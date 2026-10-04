"use client";

import { useSearchParams } from "next/navigation";
import { PhoneOtp } from "@/components/auth/PhoneOtp";

export function PhoneGate() {
  const search = useSearchParams();
  const next = search.get("next") || "/account";
  return (
    <article className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="kicker">YOU</p>
      <h1 className="display mt-3 text-5xl">Mobile number</h1>
      <p className="mt-3 text-sm text-[#F6F1DC]/65">Enter your number, then the OTP.</p>
      <div className="mt-8">
        <PhoneOtp next={next} />
      </div>
    </article>
  );
}
