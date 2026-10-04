import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn how ROVEYA delivers comfortable, reliable and transparent travel.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
      <p className="kicker">About ROVEYA</p>
      <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">Travel with confidence</h1>
      <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-5 text-base leading-8 text-[#F6F1DC]/72">
          <p>
            ROVEYA is a transportation service for people who value comfort, reliability and clarity. We operate with a simple idea: the journey should feel considered, and paying for it should never be confusing.
          </p>
          <p>
            Passengers already travelling with ROVEYA can scan a permanent QR inside the vehicle, enter a few details, see the exact per-seat fare and pay digitally or in cash. There is no account to create and no booking to complete — you are already on the journey.
          </p>
          <p>
            Behind that simplicity is a careful process: destinations and fares are managed from our operations desk, totals are calculated on the server, and cash payments are confirmed only by authorised ROVEYA staff.
          </p>
          <Link href="/pay" className="inline-flex pt-2 text-xs font-semibold tracking-[0.18em] text-[#D6A000]">
            PAY FOR YOUR RIDE
          </Link>
        </div>
        <div className="gold-frame overflow-hidden rounded-[28px]">
          <Image
            src="/images/cabin.jpg"
            alt="A calm, well-kept cabin prepared for travel"
            width={1200}
            height={900}
            className="h-[420px] w-full object-cover"
          />
        </div>
      </div>
    </article>
  );
}
