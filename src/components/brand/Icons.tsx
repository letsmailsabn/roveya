type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconComfort({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path {...stroke} d="M6 20h20l-2.5-7H8.5L6 20Z" />
      <path {...stroke} d="M10 13l2-5h8l2 5" />
      <circle {...stroke} cx="11" cy="22.5" r="1.6" />
      <circle {...stroke} cx="21" cy="22.5" r="1.6" />
    </svg>
  );
}

export function IconFare({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect {...stroke} x="7" y="8" width="18" height="16" rx="2" />
      <path {...stroke} d="M11 14h10M11 18h6" />
    </svg>
  );
}

export function IconPay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect {...stroke} x="8" y="8" width="16" height="16" rx="2" />
      <path {...stroke} d="M12 12h8v8h-8zM12 16h8M16 12v8" />
    </svg>
  );
}

export function IconHeart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path {...stroke} d="M16 24s-8-5.2-8-10.2A4.4 4.4 0 0 1 16 11a4.4 4.4 0 0 1 8 2.8C24 18.8 16 24 16 24Z" />
    </svg>
  );
}

export function IconPoint({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle {...stroke} cx="8" cy="16" r="3" />
      <circle {...stroke} cx="24" cy="16" r="3" />
      <path {...stroke} d="M11 16h10" />
    </svg>
  );
}

export function IconDistance({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path {...stroke} d="M6 22c4-10 16-10 20 0" />
      <path {...stroke} d="M7 18h3l2 4h8l2-4h3" />
    </svg>
  );
}

export function IconRoute({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle {...stroke} cx="9" cy="9" r="2.5" />
      <circle {...stroke} cx="23" cy="23" r="2.5" />
      <path {...stroke} d="M11 11c8-1 2 11 10 10" />
    </svg>
  );
}

export function IconGroup({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle {...stroke} cx="12" cy="12" r="3" />
      <circle {...stroke} cx="20" cy="12" r="3" />
      <path {...stroke} d="M7 22c.8-3 3-4.5 5-4.5s4.2 1.5 5 4.5M20 17.5c2 0 4.2 1.5 5 4.5" />
    </svg>
  );
}

export function IconSeat({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path {...stroke} d="M10 22V12a4 4 0 0 1 8 0v10" />
      <path {...stroke} d="M8 22h16v3H8z" />
    </svg>
  );
}
