import QRCode from "qrcode";
import { requireStaff } from "@/lib/auth";
import { siteUrl } from "@/lib/data";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireStaff();
    const url = `${siteUrl()}/pay`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 420,
      color: { dark: "#600042", light: "#F9F7E2" },
    });
    return Response.json({ url, qrDataUrl });
  } catch (error) {
    return toErrorResponse(error);
  }
}
