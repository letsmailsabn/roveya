import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 leading-8 text-[#F6F1DC]/75">
      <h1 className="display text-5xl text-[#F6F1DC]">Terms & Conditions</h1>
      <p className="mt-6">
        ROVEYA provides transportation and in-vehicle payment recording. Using the /pay page does not create a booking. It records the seats you are already occupying, calculates the current per-seat fare and processes payment.
      </p>
      <p className="mt-4">
        Online payments are confirmed only after provider verification. Cash payments remain pending until an authorised ROVEYA administrator confirms that cash was received.
      </p>
      <p className="mt-4">
        Historical ride amounts are stored at the time of travel and are not changed if destination fares are updated later.
      </p>
    </article>
  );
}
