import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/ContactForm";
import { getSettings } from "@/lib/data";
import { whatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach the ROVEYA desk by phone, WhatsApp, or email for a seat, a route, or a journey already underway.",
};

const topics = [
  {
    title: "A seat or a fare",
    copy: "Ask how a seat is allocated, or what the fare is for the passengers travelling with you.",
  },
  {
    title: "A route",
    copy: "Ask about a journey between our cities, including travel with more than one passenger.",
  },
  {
    title: "A ride already moving",
    copy: "Luggage, the break point, or a question from inside the car can come straight to the desk.",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();
  const phoneHref = settings.phone.replace(/\s/g, "");

  return (
    <article>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <p className="kicker">Contact</p>
          <h1 className="display mt-4 max-w-xl text-5xl text-[#F6F1DC] md:text-7xl">The desk is easy to reach.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#F6F1DC]/72">
            Call, send a WhatsApp message, or write to us. One clear note is enough. The desk answers during the hours below.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#F6F1DC]/55">{settings.hours}</p>
        </div>
        <div className="gold-frame overflow-hidden rounded-[28px]">
          <Image
            src="/images/hero.jpg"
            alt="ROVEYA travel, ready when you need the desk"
            width={1400}
            height={900}
            priority
            className="h-72 w-full object-cover sm:h-[420px]"
          />
        </div>
      </section>

      <section className="border-y border-[#D6A000]/20 bg-[#241018]">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-12 md:grid-cols-3 lg:px-8">
          <a href={`tel:${phoneHref}`} className="rounded-[28px] border border-[#D6A000]/25 bg-[#12060D] p-6 transition hover:border-[#D6A000]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#D6A000]">Phone</p>
            <p className="display mt-3 text-3xl">{settings.phone}</p>
            <p className="mt-3 text-sm leading-6 text-[#F6F1DC]/65">Best when you want an answer on the same call.</p>
          </a>
          <a
            href={whatsAppLink(settings.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="rounded-[28px] border border-[#D6A000]/25 bg-[#12060D] p-6 transition hover:border-[#D6A000]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#D6A000]">WhatsApp</p>
            <p className="display mt-3 text-3xl">Send a message</p>
            <p className="mt-3 text-sm leading-6 text-[#F6F1DC]/65">Useful from the car, when a short note is enough.</p>
          </a>
          <a href={`mailto:${settings.email}`} className="rounded-[28px] border border-[#D6A000]/25 bg-[#12060D] p-6 transition hover:border-[#D6A000]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#D6A000]">Email</p>
            <p className="mt-3 text-2xl font-semibold break-all">{settings.email}</p>
            <p className="mt-3 text-sm leading-6 text-[#F6F1DC]/65">For a longer note you want kept in writing.</p>
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="kicker">What to ask</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">A simple question is welcome.</h2>
          <ul className="mt-8 space-y-4">
            {topics.map((topic) => (
              <li key={topic.title} className="rounded-2xl border border-[#D6A000]/25 px-5 py-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">{topic.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#F6F1DC]/68">{topic.copy}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm leading-7 text-[#F6F1DC]/60">
            {settings.address}
          </p>
          <p className="mt-4 text-sm leading-7 text-[#F6F1DC]/60">
            Already in the vehicle? Payment stays on the ride page.
          </p>
          <Link href="/pay" className="mt-4 inline-flex text-xs font-semibold tracking-[0.18em] text-[#D6A000]">
            PAY FOR YOUR RIDE
          </Link>
        </div>
        <ContactForm intro />
      </section>
    </article>
  );
}
