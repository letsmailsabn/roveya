import { vehiclePayUrl, vehicleQrPng, vehicleQrSvg, vehicleScanCardSvg } from "@/lib/vehicle-qr";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const format = query.get("format");
  const driver = query.get("driver") ?? "";
  const driverId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(driver) ? driver : undefined;
  const url = vehiclePayUrl(driverId);
  if (format === "card") {
    const card = await vehicleScanCardSvg(url);
    return new Response(card, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="roveya-pay-card.svg"',
        "Cache-Control": "no-store",
      },
    });
  }
  if (format === "svg") {
    const svg = await vehicleQrSvg(url);
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="roveya-pay-qr.svg"',
        "Cache-Control": "no-store",
      },
    });
  }
  const png = await vehicleQrPng(url);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="roveya-pay-qr.png"',
      "Cache-Control": "no-store",
    },
  });
}
