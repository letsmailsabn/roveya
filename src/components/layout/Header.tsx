"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { Logo } from "@/components/brand/Logo";
import { track } from "@/components/analytics/track";
import { createClient } from "@/lib/supabase/browser";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/routes", label: "Pool a Ride" },
  { href: "/contact", label: "Contact Us" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [youOpen, setYouOpen] = useState(false);
  const [who, setWho] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      const name = String(user?.user_metadata?.full_name || user?.user_metadata?.name || "").trim();
      setWho(user ? name || user.email || "Signed in" : null);
    });
  }, [pathname, youOpen]);

  async function signOut() {
    await createClient().auth.signOut();
    setWho(null);
    setYouOpen(false);
    window.location.href = "/";
  }

  const item = "relative pb-1 text-[13px] tracking-[0.14em] uppercase transition hover:text-[#D6A000]";

  return (
    <header className="sticky top-0 z-50 border-b border-[#D6A000]/20 bg-[#12060D]/92 backdrop-blur-md">
      <div className="relative">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 pr-[4.5rem] sm:gap-6 sm:px-5 sm:py-4 lg:px-8 lg:pr-20">
        <Logo />
        <nav className="ml-auto hidden items-center gap-6 text-[#F6F1DC] lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`${item} ${active ? "text-[#D6A000]" : ""}`}>
                {link.label}
                {active ? <span className="absolute inset-x-1 -bottom-0.5 h-px bg-[#D6A000]" /> : null}
              </Link>
            );
          })}
          <Link
            href="/pay"
            onClick={() => track("pay_button_clicked")}
            className="rounded-full bg-[#6B1838] px-5 py-2.5 text-center text-[10px] font-semibold leading-snug tracking-[0.14em] text-[#F6F1DC] uppercase transition hover:bg-[#4C102C] hover:shadow-[0_0_0_1px_#D6A000]"
          >
            Pay for
            <br />
            your ride
          </Link>
        </nav>
        <div className="ml-auto lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D6A000]/40"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-px w-4 bg-[#F6F1DC]" />
              <span className="block h-px w-4 bg-[#F6F1DC]" />
              <span className="block h-px w-4 bg-[#F6F1DC]" />
            </span>
          </button>
        </div>
      </div>
      <div className="absolute right-0 top-1/2 z-50 -translate-y-1/2">
        <button
          type="button"
          onClick={() => setYouOpen((value) => !value)}
          className="m-0 inline-flex cursor-pointer items-center rounded-l-full border border-r-0 border-[#D6A000] bg-[#6B1838] py-2 pl-4 pr-3 text-[13px] font-semibold leading-none tracking-[0.14em] text-[#F6F1DC] uppercase transition hover:bg-[#4C102C]"
        >
          You
        </button>
        {youOpen ? (
          <div className="absolute right-3 top-full z-50 mt-3 hidden w-80 rounded-3xl border border-[#E0B23A] bg-[#2A1020] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] lg:block">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#E0B23A]">YOU</p>
            {who ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-[#F6F1DC]">{who}</p>
                <Link href="/account" onClick={() => setYouOpen(false)} className="block text-[#E0B23A]">
                  Your trips
                </Link>
                <button type="button" onClick={() => void signOut()} className="text-[#F6F1DC]/70">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <GoogleSignIn next={pathname} />
              </div>
            )}
          </div>
        ) : null}
      </div>
      </div>
      {youOpen ? (
        <div className="border-t border-[#D6A000]/20 bg-[#12060D] px-5 py-4 lg:hidden">
          {who ? (
            <div className="space-y-3 text-sm uppercase tracking-[0.14em]">
              <p className="text-[#F6F1DC]">{who}</p>
              <Link href="/account" onClick={() => setYouOpen(false)} className="block text-[#D6A000]">
                Your trips
              </Link>
              <button type="button" onClick={() => void signOut()} className="text-[#F6F1DC]/70">
                Sign out
              </button>
            </div>
          ) : (
            <GoogleSignIn next={pathname} />
          )}
        </div>
      ) : null}
      {open ? (
        <div className="border-t border-[#D6A000]/20 bg-[#12060D] px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-3 text-sm uppercase tracking-[0.14em] text-[#F6F1DC]" aria-label="Mobile">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-2">
                {link.label}
              </Link>
            ))}
            <Link
              href="/pay"
              onClick={() => {
                setOpen(false);
                track("pay_button_clicked");
              }}
              className="py-2"
            >
              Pay for your ride
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
