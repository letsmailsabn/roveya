import type { Metadata } from "next";
import Link from "next/link";
import { StickerActions } from "@/components/pay/StickerActions";
import { getActiveDrivers } from "@/lib/data";
import { vehiclePayUrl, vehicleQrSvg } from "@/lib/vehicle-qr";

export const metadata: Metadata = {
  title: "Vehicle payment card",
  robots: { index: false, follow: false },
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VehicleStickerPage({ searchParams }: { searchParams: Promise<{ driver?: string }> }) {
  const query = await searchParams;
  const drivers = await getActiveDrivers();
  const selected = drivers.find((driver) => driver.id === query.driver) ?? drivers[0];
  const url = vehiclePayUrl(selected?.id && uuid.test(selected.id) ? selected.id : undefined);
  const svg = await vehicleQrSvg(url);
  const host = url.replace(/^https:\/\//, "");

  return (
    <main className="pay-sheet mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-5 py-10">
      <style>{`
        .pay-card svg { width: 68mm; height: 68mm; display: block; }
        @media print {
          @page { size: 105mm 148mm; margin: 0; }
          .no-print { display: none !important; }
          html, body, .min-h-dvh { background: white !important; color: #12060D !important; }
          .pay-sheet { min-height: auto !important; padding: 0 !important; background: white !important; }
          .pay-card { margin: 0 auto; box-shadow: none !important; }
        }
      `}</style>
      <div className="no-print mb-8 max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D6A000]">For the vehicle</p>
        <h1 className="mt-3 text-3xl font-semibold">Payment card</h1>
        <p className="mt-3 text-sm leading-6 text-[#F6F1DC]/75">
          Print the card for this vehicle. A scan opens Pay for your ride, and cash is sent to this driver&apos;s phone.
        </p>
        {drivers.length > 1 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {drivers.map((driver) => (
              <Link
                key={driver.id}
                href={`/pay/sticker?driver=${driver.id}`}
                className={`rounded-full px-3 py-2 text-xs ${driver.id === selected?.id ? "bg-[#D6A000] text-[#12060D]" : "border border-[#D6A000]/40 text-[#F6F1DC]"}`}
              >
                {driver.name} · {driver.vehicleNumber}
              </Link>
            ))}
          </div>
        ) : null}
        {selected ? <p className="mt-3 text-sm text-[#F6F1DC]/80">{selected.name} · {selected.vehicleNumber}</p> : null}
      </div>
      <StickerActions downloadHref={selected ? `/api/vehicle-qr?driver=${selected.id}` : "/api/vehicle-qr"} />
      <article className="pay-card w-[105mm] rounded-[8mm] bg-white px-[10mm] py-[9mm] text-center text-[#12060D] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <p className="text-[15px] font-semibold tracking-[0.28em]">ROVEYA</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#6B1838]">Premium taxipool and travel</p>
        <h2 className="mt-5 text-[22px] font-semibold leading-tight">Pay for your ride</h2>
        <p className="mt-2 text-[11px] leading-5 text-[#12060D]/70">Point your phone camera here. No app is needed.</p>
        <div className="mx-auto mt-4 w-fit" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-3 text-[11px] font-medium tracking-wide">{host}</p>
      </article>
      <p className="no-print mt-8 max-w-md text-center text-xs leading-5 text-[#F6F1DC]/55">
        Leave the white border around the code. After you stick it, scan it once with your own phone and confirm Pay for your ride opens.
      </p>
    </main>
  );
}
