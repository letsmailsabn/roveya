"use client";

import Link from "next/link";
import { track } from "@/components/analytics/track";

export function PayCta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href="/pay" onClick={() => track("pay_button_clicked")} className={className}>
      {children}
    </Link>
  );
}
