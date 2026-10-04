import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay For Your Ride",
  description: "Pay for your ROVEYA ride from your seat.",
  robots: { index: false, follow: false },
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#12060D] text-[#F6F1DC]">{children}</div>;
}
