import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnalyticsPing } from "@/components/analytics/track";

export const metadata: Metadata = {
  title: "Services",
  description:
    "ROVEYA rides include your own clean seat, a mineral water bottle, a planned break, and luggage attended to before you board. A 7-seater carries only four or five passengers.",
};

const included = [
  {
    title: "Mineral water",
    copy: "A basic sealed mineral water bottle is kept for you. It is a simple part of the ride, ready when you want it.",
  },
  {
    title: "A planned break",
    copy: "On a longer journey we make one planned stop. You step out, then return to the same allocated seat. The stop is not skipped to save time.",
  },
  {
    title: "Luggage attended to",
    copy: "Your luggage is collected and placed before you board. The open seats keep it clear of the passenger beside you.",
  },
  {
    title: "Handled for you",
    copy: "Luggage, the break, and the fare are arranged as part of the ride. You take your seat. The details are already in place.",
  },
];

const ride = [
  {
    title: "One seat, one passenger",
    copy: "The seat is allocated to you. It is not combined with another customer.",
  },
  {
    title: "A clean place to sit",
    copy: "The seat is cleaned before you board, so hygiene is already taken care of.",
  },
  {
    title: "Four or five in a 7-seater",
    copy: "We leave one or two seats open. The extra room is the service, not an empty mistake.",
  },
  {
    title: "Pay for your seat",
    copy: "The fare is per person, for the seat that is yours. You can pay from the car when the journey is underway.",
  },
];

export default function ServicesPage() {
  return (
    <article>
      <AnalyticsPing event="services_viewed" />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <p className="kicker">Services</p>
          <h1 className="display mt-4 max-w-xl text-5xl text-[#F6F1DC] md:text-7xl">Care that travels with you.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#F6F1DC]/72">
            A ROVEYA journey is a comfortable seat of your own, in a clean cabin, with a few provisions kept ready: mineral water, a planned break, and luggage attended to before you sit.
          </p>
        </div>
        <div className="gold-frame overflow-hidden rounded-[28px]">
          <Image
            src="/images/cabin.jpg"
            alt="A clean cabin seat prepared for one ROVEYA passenger"
            width={1200}
            height={900}
            priority
            className="h-72 w-full object-cover sm:h-[460px]"
          />
        </div>
      </section>

      <section className="border-y border-[#D6A000]/20 bg-[#241018]">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
          <p className="kicker">Included on the ride</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">Small things, kept ready.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {included.map((item) => (
              <article key={item.title} className="rounded-[28px] border border-[#D6A000]/20 bg-[#12060D] p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#E0B23A]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/72">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div className="gold-frame overflow-hidden rounded-[28px] lg:order-2">
          <Image
            src="/images/highway.jpg"
            alt="A ROVEYA journey with time for a proper break"
            width={1600}
            height={900}
            className="h-72 w-full object-cover sm:h-[420px]"
          />
        </div>
        <div>
          <p className="kicker">The way we travel</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">Comfort is the service.</h2>
          <p className="mt-5 text-base leading-8 text-[#F6F1DC]/72">
            The car is a 7-seater. We still carry only four or five passengers. Your seat stays yours, the cabin stays clean, and nobody is hurried into a full vehicle.
          </p>
          <ul className="mt-8 space-y-4">
            {ride.map((item) => (
              <li key={item.title} className="rounded-2xl border border-[#D6A000]/25 px-5 py-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#F6F1DC]/68">{item.copy}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#241018] py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <p className="kicker">From seat to stop</p>
          <h2 className="display mt-3 max-w-2xl text-4xl md:text-5xl">What the journey feels like.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-[28px] bg-[#12060D] p-6">
              <p className="text-xs tracking-[0.2em] text-[#D6A000]">01</p>
              <h3 className="display mt-3 text-3xl">You board calmly</h3>
              <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/70">
                Your luggage is collected, your seat is waiting, and a water bottle is already there.
              </p>
            </article>
            <article className="rounded-[28px] bg-[#12060D] p-6">
              <p className="text-xs tracking-[0.2em] text-[#D6A000]">02</p>
              <h3 className="display mt-3 text-3xl">You travel with room</h3>
              <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/70">
                Four or five passengers share the 7-seater. The open seats keep the cabin comfortable for the whole way.
              </p>
            </article>
            <article className="rounded-[28px] bg-[#12060D] p-6">
              <p className="text-xs tracking-[0.2em] text-[#D6A000]">03</p>
              <h3 className="display mt-3 text-3xl">You stop, then continue</h3>
              <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/70">
                On a longer journey there is one planned stop. You step out, then return to the same allocated seat. The stop is not skipped to save time.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <p className="kicker">Already travelling</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">The fare covers your seat.</h2>
          <p className="mt-4 max-w-lg text-base leading-8 text-[#F6F1DC]/72">
            Mineral water, a planned break, and luggage attended to before departure are part of the way ROVEYA travels. You pay for the seat that was allocated to you.
          </p>
          <Link href="/pay" className="btn-primary mt-8">
            PAY FOR YOUR RIDE
          </Link>
        </div>
        <div className="gold-frame overflow-hidden rounded-[28px]">
          <Image src="/images/hero.jpg" alt="ROVEYA vehicle prepared for a comfortable ride" width={1400} height={900} className="h-64 w-full object-cover sm:h-80" />
        </div>
      </section>
    </article>
  );
}
