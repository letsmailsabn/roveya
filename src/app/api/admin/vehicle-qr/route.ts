import QRCode from "qrcode";
import { requireStaff } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { vehiclePayUrl } from "@/lib/vehicle-qr";

export async function GET() {
  try {
    await requireStaff();
    const url = vehiclePayUrl();
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 800,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    return Response.json({ url, qrDataUrl });
  } catch (error) {
    return toErrorResponse(error);
  }
}
