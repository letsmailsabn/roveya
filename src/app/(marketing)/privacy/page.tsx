import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", robots: { index: true, follow: true } };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 leading-8 text-[#F6F1DC]/75">
      <h1 className="display text-5xl text-[#F6F1DC]">Privacy Policy</h1>
      <p className="mt-6">
        ROVEYA collects only the information needed to record a ride and process payment: your name, mobile number, destination, seat count, payment references and optional feedback.
      </p>
      <p className="mt-4">
        Online payments are processed by Razorpay. ROVEYA stores the payment reference Razorpay returns. We do not store card numbers, CVV codes, UPI PINs or payment passwords.
      </p>
      <p className="mt-4">
        Ride records are retained for operational, accounting and customer-service purposes. Analytics on the public website does not include personal customer information.
      </p>
    </article>
  );
}
