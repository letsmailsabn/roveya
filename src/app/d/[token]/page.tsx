import type { Metadata } from "next";
import { CashDecision } from "@/components/pay/CashDecision";
import { readCashLink } from "@/lib/services/cash";

export const metadata: Metadata = {
  title: "Confirm cash",
  robots: { index: false, follow: false },
};

export default async function DriverCashLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cash = await readCashLink(token);
  if (!cash) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#12060D] px-5 text-center text-[#F6F1DC]">
        <h1 className="text-3xl font-semibold">Link not valid</h1>
        <p className="mt-3 text-sm text-[#F6F1DC]/70">This cash confirmation is not open.</p>
      </main>
    );
  }
  return <CashDecision token={token} cash={cash} />;
}
