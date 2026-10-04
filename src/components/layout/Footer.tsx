import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { SiteSetting } from "@/lib/data";

const quick = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/routes", label: "Routes" },
  { href: "/contact", label: "Contact Us" },
];

export function Footer({ settings }: { settings: SiteSetting }) {
  const socials = [
    settings.instagramUrl ? { href: settings.instagramUrl, label: "Instagram" } : null,
    settings.facebookUrl ? { href: settings.facebookUrl, label: "Facebook" } : null,
    settings.twitterUrl ? { href: settings.twitterUrl, label: "X" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="border-t border-[#D6A000]/20 bg-[#0C0308] text-[#F6F1DC]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-4 lg:px-8">
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
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </li>
          </ul>
          {socials.length > 0 ? (
            <div className="mt-5 flex gap-4 text-sm">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="hover:text-[#D6A000]">
                  {s.label}
                </a>
              ))}
            </div>
          ) : null}
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
