import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "ROVEYA gives every passenger their own clean seat. Our 7-seater cars carry only four or five passengers, so the journey stays comfortable.",
};

const promises = [
  {
    title: "Your own seat",
    copy: "Every seat is given to one passenger. Two people are never asked to share one place.",
  },
  {
    title: "A clean seat",
    copy: "Seats are cleaned and prepared before you sit. Hygiene is part of the ride, not an extra.",
  },
  {
    title: "Room we keep open",
    copy: "The car can hold seven. We stop at four or five passengers so the cabin never feels packed.",
  },
];

const journey = [
  {
    n: "01",
    title: "You take your seat",
    copy: "The place is yours for the journey. It is not combined with another passenger.",
  },
  {
    n: "02",
    title: "The cabin stays open",
    copy: "Empty seats stay empty. That space is for legs, bags and an easier ride.",
  },
  {
    n: "03",
    title: "We do not rush you",
    copy: "Boarding is calm. We would rather leave a seat free than hurry one more person in.",
  },
  {
    n: "04",
    title: "You pay for your seat",
    copy: "The fare is per person, for the seat allocated to you. The amount is clear before you pay.",
  },
];

const seats: { label: string; kind: "driver" | "guest" | "open" }[] = [
  { label: "Driver", kind: "driver" },
  { label: "Passenger", kind: "guest" },
  { label: "Passenger", kind: "guest" },
  { label: "Left open", kind: "open" },
  { label: "Passenger", kind: "guest" },
  { label: "Passenger", kind: "guest" },
  { label: "Left open", kind: "open" },
];

export default function AboutPage() {
  return (
    <article>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="kicker">About ROVEYA</p>
            <h1 className="display mt-4 max-w-xl text-5xl text-[#F6F1DC] md:text-7xl">Comfort has a seat of its own.</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#F6F1DC]/72">
              ROVEYA is built for passengers who want a calm journey. You get a comfortable seat that belongs to you, in a clean cabin, with room left on purpose.
            </p>
          </div>
          <div className="gold-frame overflow-hidden rounded-[28px]">
            <Image
              src="/images/highway.jpg"
              alt="A ROVEYA car travelling at an easy pace"
              width={1600}
              height={900}
              priority
              className="h-72 w-full object-cover sm:h-[460px]"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[#D6A000]/20 bg-[#241018]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3 lg:px-8">
          {promises.map((item) => (
            <div key={item.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#E0B23A]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/72">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="kicker">How we fill the car</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">A 7-seater. Four or five passengers.</h2>
          <p className="mt-5 text-base leading-8 text-[#F6F1DC]/72">
            The vehicle has seven seats. We do not use all of them. Four or five passengers travel, and the seats that remain are left open so everyone can sit properly.
          </p>
          <p className="mt-4 text-base leading-8 text-[#F6F1DC]/72">
            We do not rush the cabin full. A fuller car would leave sooner, and it would also leave you with less room. Comfort comes first.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#241018] px-4 py-5">
              <dt className="text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/50">Seats in the car</dt>
              <dd className="display mt-2 text-4xl text-[#E0B23A]">7</dd>
            </div>
            <div className="rounded-2xl bg-[#241018] px-4 py-5">
              <dt className="text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/50">Passengers</dt>
              <dd className="display mt-2 text-4xl">4–5</dd>
            </div>
            <div className="rounded-2xl bg-[#241018] px-4 py-5">
              <dt className="text-xs uppercase tracking-[0.16em] text-[#F6F1DC]/50">Left open</dt>
              <dd className="display mt-2 text-4xl">1–2</dd>
            </div>
          </dl>
        </div>
        <SeatPlan />
      </section>

      <section className="bg-[#241018] py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div className="gold-frame overflow-hidden rounded-[28px]">
            <Image
              src="/images/cabin.jpg"
              alt="Clean leather seats prepared for one passenger each"
              width={1200}
              height={900}
              className="h-[420px] w-full object-cover"
            />
          </div>
          <div>
            <p className="kicker">The seat you sit in</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">Clean, and allocated to you.</h2>
            <p className="mt-5 text-base leading-8 text-[#F6F1DC]/72">
              A comfortable seat is prepared for one customer. It is not a shared spot, and it is not left as the last passenger found it.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="rounded-2xl border border-[#D6A000]/25 px-5 py-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">One customer, one seat</p>
                <p className="mt-2 text-sm leading-6 text-[#F6F1DC]/68">Your place is allocated before the journey settles. Nobody is combined into your seat.</p>
              </li>
              <li className="rounded-2xl border border-[#D6A000]/25 px-5 py-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">Hygiene before boarding</p>
                <p className="mt-2 text-sm leading-6 text-[#F6F1DC]/68">Seats are cleaned so you sit down on a fresh surface, not on the previous journey.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <p className="kicker">On the journey</p>
        <h2 className="display mt-3 max-w-2xl text-4xl md:text-5xl">Unhurried from the first minute.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {journey.map((step) => (
            <div key={step.n} className="rounded-[28px] bg-[#241018] p-6">
              <p className="text-xs tracking-[0.2em] text-[#D6A000]">{step.n}</p>
              <h3 className="display mt-3 text-3xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/70">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-[#D6A000]/20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="kicker">Already with us</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">Pay for the seat that is yours.</h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-[#F6F1DC]/72">
              If you are already travelling, scan the card in the car or continue to payment. The fare is for your seat, and only your seat.
            </p>
            <Link href="/pay" className="btn-primary mt-8">
              PAY FOR YOUR RIDE
            </Link>
          </div>
          <div className="gold-frame overflow-hidden rounded-[28px]">
            <Image src="/images/hero.jpg" alt="ROVEYA vehicle ready for a comfortable journey" width={1400} height={900} className="h-64 w-full object-cover sm:h-80" />
          </div>
        </div>
      </section>
    </article>
  );
}

function SeatPlan() {
  return (
    <div className="rounded-[28px] border border-[#D6A000]/30 bg-[#1C0A14] p-6 sm:p-8">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-[#D6A000]">A typical ROVEYA cabin</p>
      <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
        {seats.slice(0, 2).map((seat) => (
          <Seat key={`front-${seat.label}-${seat.kind}`} seat={seat} />
        ))}
      </div>
      <div className="mx-auto mt-3 grid max-w-sm grid-cols-3 gap-3">
        {seats.slice(2, 5).map((seat, index) => (
          <Seat key={`mid-${index}`} seat={seat} />
        ))}
      </div>
      <div className="mx-auto mt-3 grid max-w-sm grid-cols-2 gap-3">
        {seats.slice(5).map((seat, index) => (
          <Seat key={`rear-${index}`} seat={seat} />
        ))}
      </div>
      <p className="mt-6 text-center text-sm leading-6 text-[#F6F1DC]/60">Four passengers shown, with two seats left open. A fifth can join, and one seat still stays free.</p>
    </div>
  );
}

function Seat({ seat }: { seat: { label: string; kind: "driver" | "guest" | "open" } }) {
  const open = seat.kind === "open";
  return (
    <div
      className={`flex min-h-20 flex-col items-center justify-center rounded-2xl px-2 text-center ${
        open ? "border border-dashed border-[#D6A000]/50 text-[#E0B23A]" : "bg-[#6B1838] text-[#F6F1DC]"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">{seat.kind === "driver" ? "Front" : open ? "Space" : "Seat"}</span>
      <span className="mt-1 text-sm font-semibold">{seat.label}</span>
    </div>
  );
}
