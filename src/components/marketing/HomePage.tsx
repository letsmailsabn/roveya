import Image from "next/image";
import Link from "next/link";
import { AnalyticsPing } from "@/components/analytics/track";
import { ContactForm } from "@/components/marketing/ContactForm";
import { PayCta } from "@/components/marketing/PayCta";
import { REASONS, SERVICES, TRUST } from "@/lib/content";
import { siteUrl, type PublicTestimonial, type SiteSetting, type TravelRoute } from "@/lib/data";
import { formatClock } from "@/lib/time";
import { formatInr } from "@/lib/validation";

export function HomePage({
  routes,
  testimonials,
  settings,
}: {
  routes: TravelRoute[];
  testimonials: PublicTestimonial[];
  settings: SiteSetting;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ROVEYA",
    url: siteUrl(),
    description: "Premium transportation and in-vehicle digital ride payments.",
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressCountry: "IN",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnalyticsPing event="homepage_visit" />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[#6B1838]/30 lg:block" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="kicker">Premium journeys. Simple travel.</p>
            <h1 className="display mt-5 max-w-xl text-4xl text-[#F6F1DC] sm:text-5xl md:text-7xl">
              Travel better.
              <br />
              Arrive better.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-[#F6F1DC]/72">
              Reliable, comfortable and transparent travel for every journey. ROVEYA makes every ride easy — including payment from your seat.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <PayCta className="btn-primary w-full sm:w-auto">PAY FOR YOUR RIDE</PayCta>
              <Link href="/routes" className="btn-ghost w-full sm:w-auto">
                POOL A RIDE
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-5 top-10 hidden h-36 w-px bg-[#D6A000] lg:block" />
            <div className="absolute -bottom-5 -right-4 hidden h-28 w-28 border border-[#D6A000]/70 lg:block" />
            <div className="gold-frame relative overflow-hidden rounded-[28px]">
              <Image
                src="/images/hero.jpg"
                alt="Premium ROVEYA vehicle on an open road"
                width={1600}
                height={900}
                priority
                className="h-64 w-full object-cover sm:h-[420px] md:h-[520px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#D6A000]/20 bg-[#241018]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4 lg:px-8">
          {TRUST.map(({ title, copy, Icon }) => (
            <div key={title} className="flex gap-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D6A000] text-[#D6A000]">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#F6F1DC]/68">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="kicker">About us</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">Travel with confidence</h2>
          <p className="mt-5 max-w-lg text-base leading-8 text-[#F6F1DC]/72">
            ROVEYA is a transportation service built around comfort, reliable journeys, transparent pricing and simple digital payments. Passengers already travelling with us can pay from their seat — without creating an account or booking in advance.
          </p>
          <Link href="/about" className="mt-8 inline-flex text-xs font-semibold tracking-[0.18em] text-[#D6A000]">
            LEARN MORE
          </Link>
        </div>
        <div className="gold-frame overflow-hidden rounded-[28px]">
          <Image
            src="/images/cabin.jpg"
            alt="Comfortable cabin prepared for a ROVEYA journey"
            width={1100}
            height={825}
            className="h-[380px] w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-[#241018] py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <p className="kicker">What we offer</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">Our services</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <article
                key={s.title}
                className="rounded-3xl border border-[#D6A000]/20 bg-[#1C0A14] p-7 transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(79,0,57,0.08)]"
              >
                <s.Icon className="h-8 w-8 text-[#D6A000]" />
                <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/68">{s.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <p className="kicker">Taxipool</p>
        <h2 className="display mt-3 text-4xl md:text-5xl">Pool a ride</h2>
        <p className="mt-4 max-w-xl text-[#F6F1DC]/68">
          Each route has a starting point, a destination, and a departure and arrival time. You share the taxi with other passengers.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <article key={route.id} className="rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-7">
              <div className="h-px w-10 bg-[#D6A000]" />
              <h3 className="display mt-4 text-3xl">
                {route.origin}
                <span className="mt-1 block text-xl text-[#D6A000]">to {route.destination}</span>
              </h3>
              <p className="mt-3 text-sm text-[#F6F1DC]/70">
                {formatClock(route.departAt)} – {formatClock(route.arriveAt)}
              </p>
              <p className="mt-2 text-sm font-semibold text-[#D6A000]">{formatInr(route.farePerSeat)} per seat</p>
              <Link href={`/routes/${route.id}`} className="mt-5 inline-flex text-xs font-semibold tracking-[0.18em] text-[#F6F1DC]">
                BOOK TAXIPOOL
              </Link>
            </article>
          ))}
        </div>
        <Link href="/routes" className="mt-8 inline-flex text-xs font-semibold tracking-[0.18em] text-[#D6A000]">
          POOL A RIDE
        </Link>
      </section>

      <section className="relative overflow-hidden bg-[#4C102C] py-20 text-[#F6F1DC]">
        <Image src="/images/highway.jpg" alt="" fill className="object-cover opacity-20" sizes="100vw" />
        <div className="relative mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="display text-4xl md:text-5xl">Why ROVEYA?</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((r) => (
              <div key={r.n}>
                <p className="display text-4xl text-[#D6A000]">{r.n}</p>
                <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.14em]">{r.t}</h3>
                <p className="mt-3 text-sm leading-7 text-[#F6F1DC]/75">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#2A0C1C] py-20 text-center text-[#F6F1DC]">
        <div className="absolute inset-x-6 top-8 h-px bg-[#D6A000]/50 sm:inset-x-12" />
        <div className="absolute inset-x-6 bottom-8 h-px bg-[#D6A000]/50 sm:inset-x-12" />
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="display text-4xl md:text-6xl">Already travelling with us?</h2>
          <p className="mt-4 text-xl text-[#D6A000]">Pay for your ride in seconds.</p>
          <p className="mt-4 text-[#F6F1DC]/75">
            Scan the QR inside your ROVEYA vehicle or continue directly to our secure ride payment page.
          </p>
          <PayCta className="mt-8 inline-flex rounded-full bg-[#F6F1DC] px-8 py-3.5 text-xs font-semibold tracking-[0.16em] text-[#4C102C] hover:shadow-[0_0_0_1px_#D6A000]">
            PAY FOR YOUR RIDE
          </PayCta>
        </div>
      </section>

      <section className="bg-[#1C0A14] py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="display text-4xl md:text-5xl">What our customers say</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <article key={t.id} className="rounded-3xl bg-[#241018] p-7 shadow-[0_10px_30px_rgba(79,0,57,0.05)]">
                <p className="text-[#D6A000]" aria-label={`${t.rating} out of 5 stars`}>
                  {"★".repeat(t.rating)}
                  <span className="text-[#F6F1DC]/20">{"★".repeat(5 - t.rating)}</span>
                </p>
                <p className="mt-4 text-sm leading-7 text-[#F6F1DC]/75">“{t.quote}”</p>
                <p className="mt-5 text-sm font-semibold">— {t.name}</p>
                {t.route ? <p className="text-xs tracking-[0.14em] text-[#F6F1DC]/45">{t.route}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#241018] py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="kicker">Contact</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">Contact us</h2>
            <p className="mt-4 max-w-md text-[#F6F1DC]/68">Speak with the ROVEYA desk for routes, group travel or service questions.</p>
            <ul className="mt-8 space-y-3 text-sm">
              <li>
                Phone:{" "}
                <a className="font-medium" href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                  {settings.phone}
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a className="font-medium" href={`https://wa.me/${settings.whatsapp}`}>
                  Message us
                </a>
              </li>
              <li>
                Email:{" "}
                <a className="font-medium" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </li>
              <li>{settings.address}</li>
              <li>{settings.hours}</li>
            </ul>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
