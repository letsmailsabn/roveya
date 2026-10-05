import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { SiteSetting } from "@/lib/data";
import { whatsAppLink } from "@/lib/whatsapp";

const quick = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/routes", label: "Pool a Ride" },
  { href: "/contact", label: "Contact Us" },
];

const fallbackTrips = [
  ["Hyderabad", "Khammam"],
  ["Hyderabad", "Warangal"],
  ["Hyderabad", "Vijayawada"],
  ["Hyderabad", "Nalgonda"],
  ["Hyderabad", "Suryapet"],
  ["Khammam", "Hyderabad"],
];

function tripKey(origin: string, destination: string) {
  return `${origin.toLowerCase()}→${destination.toLowerCase()}`;
}

export function Footer({
  settings,
  routes,
}: {
  settings: SiteSetting;
  routes: { origin: string; destination: string }[];
}) {
  const published = routes.reduce<{ origin: string; destination: string }[]>((list, route) => {
    if (list.some((item) => tripKey(item.origin, item.destination) === tripKey(route.origin, route.destination))) return list;
    list.push({ origin: route.origin, destination: route.destination });
    return list;
  }, []);
  const trips = (published.length > 0 ? published : fallbackTrips.map(([origin, destination]) => ({ origin, destination }))).slice(0, 6);
  const destinations = [...new Set(trips.map((trip) => trip.destination))].slice(0, 6);
  const socials = [
    settings.instagramUrl ? { href: settings.instagramUrl, label: "Instagram" } : null,
    settings.facebookUrl ? { href: settings.facebookUrl, label: "Facebook" } : null,
    settings.twitterUrl ? { href: settings.twitterUrl, label: "X" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="border-t border-[#D6A000]/20 bg-[#0C0308] text-[#F6F1DC]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 lg:px-8">
        <div>
          <Logo href="/" />
          <p className="mt-5 max-w-xs text-sm leading-7 text-[#F6F1DC]/80">
            Premium, reliable and transparent travel with simple in-vehicle digital payments.
          </p>
        </div>
        <div>
          <h2 className="kicker">Quick links</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {quick.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-[#D6A000]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="kicker">Customer</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/pay" className="hover:text-[#D6A000]">
                Pay For Your Ride
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="kicker">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>
            </li>
            <li>
              <a href={whatsAppLink(settings.whatsapp)} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </li>
          </ul>
          {socials.length > 0 ? (
            <div className="mt-5 flex gap-4 text-sm">
              {socials.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="hover:text-[#D6A000]">
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <h2 className="text-[0.7rem] uppercase tracking-wide text-[#D6A000]">Travel with taxipool</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {trips.map((trip) => (
              <li key={tripKey(trip.origin, trip.destination)}>
                <Link
                  href={`/routes?from=${encodeURIComponent(trip.origin)}&to=${encodeURIComponent(trip.destination)}`}
                  className="hover:text-[#D6A000]"
                >
                  {trip.origin} → {trip.destination}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[0.7rem] uppercase tracking-wide text-[#D6A000]">Popular destinations</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {destinations.map((city) => (
              <li key={city}>
                <Link href={`/routes?to=${encodeURIComponent(city)}`} className="hover:text-[#D6A000]">
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="gold-line" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-[#F6F1DC]/70 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} ROVEYA. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
