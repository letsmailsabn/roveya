import type { Metadata } from "next";
import Link from "next/link";
import { StickerActions } from "@/components/pay/StickerActions";
import { getActiveDrivers } from "@/lib/data";
import { vehiclePayUrl, vehicleScanCardSvg } from "@/lib/vehicle-qr";

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
  const svg = await vehicleScanCardSvg(url);

  return (
    <main className="pay-sheet mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-5 py-10">
      <style>{`
        .pay-card > svg { width: 148mm; height: 210mm; display: block; }
        @media print {
          @page { size: 148mm 210mm; margin: 0; }
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
          Print this full card for the vehicle. The code carries the ROVEYA mark, and a scan opens Pay for your ride.
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
      <StickerActions downloadHref={selected ? `/api/vehicle-qr?format=card&driver=${selected.id}` : "/api/vehicle-qr?format=card"} />
      <article className="pay-card w-[148mm] bg-white text-[#12060D] shadow-[0_24px_60px_rgba(0,0,0,0.35)]" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="no-print mt-8 max-w-md text-center text-xs leading-5 text-[#F6F1DC]/55">
        Leave the white border around the code. After you stick it, scan it once with your own phone and confirm Pay for your ride opens.
      </p>
    </main>
  );
}
