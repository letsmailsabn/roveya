import Link from "next/link";

type LogoProps = {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
};

export function Logo({ href = "/" }: LogoProps) {
  const mark = "#F6F1DC";
  const gold = "#D6A000";
  const word = "#F6F1DC";

  const inner = (
    <span className="inline-flex items-center gap-2.5">
      <svg className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="1.5" y="1.5" width="37" height="37" rx="10" fill="none" stroke={gold} strokeWidth="1.2" />
        <path
          d="M11 28V12h9.2c4.1 0 6.8 2.4 6.8 5.9 0 2.5-1.4 4.5-3.7 5.4L28.8 28h-4.3l-5.1-8.4H15.2V28H11Zm4.2-11.7h5c1.9 0 3.1-1.1 3.1-2.6S22.1 11.1 20.2 11.1h-5v5.2Z"
          fill={mark}
        />
        <path d="M8 32.5h24" stroke={gold} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="leading-none">
        <span className="block text-[15px] font-semibold tracking-[0.22em] sm:text-[17px] sm:tracking-[0.28em]" style={{ color: word }}>
          ROVEYA
        </span>
        <span className="mt-1 block max-w-[8.5rem] text-[9px] uppercase leading-snug tracking-[0.12em]" style={{ color: gold }}>
          Premium taxipool and travel
        </span>
      </span>
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} aria-label="ROVEYA home" className="inline-flex">
      {inner}
    </Link>
  );
}
