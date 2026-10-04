import QRCode from "qrcode";

const LIVE_ORIGIN = "https://roveya.onrender.com";

export function publicOrigin() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  const liveHost = /^https:\/\/[a-z0-9.-]+$/i.test(configured) && !/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured);
  return liveHost ? configured : LIVE_ORIGIN;
}

export function vehiclePayUrl(driverId?: string) {
  const pay = `${publicOrigin()}/pay`;
  return driverId ? `${pay}?driver=${encodeURIComponent(driverId)}` : pay;
}

const mark = {
  errorCorrectionLevel: "H" as const,
  margin: 4,
  color: { dark: "#000000", light: "#FFFFFF" },
};

export function vehicleQrSvg(url = vehiclePayUrl()) {
  return QRCode.toString(url, { ...mark, type: "svg" });
}

export function vehicleQrPng(url = vehiclePayUrl()) {
  return QRCode.toBuffer(url, { ...mark, width: 1600, type: "png" });
}
