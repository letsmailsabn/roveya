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

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function logoMark(size: number) {
  const scale = size / 40;
  return `<g transform="scale(${scale})">
    <rect x="1.5" y="1.5" width="37" height="37" rx="10" fill="#4C102C"/>
    <path d="M11 28V12h9.2c4.1 0 6.8 2.4 6.8 5.9 0 2.5-1.4 4.5-3.7 5.4L28.8 28h-4.3l-5.1-8.4H15.2V28H11Zm4.2-11.7h5c1.9 0 3.1-1.1 3.1-2.6S22.1 11.1 20.2 11.1h-5v5.2Z" fill="#F6F1DC"/>
    <path d="M8 32.5h24" stroke="#D6A000" stroke-width="1.4" stroke-linecap="round"/>
  </g>`;
}

function withCenterLogo(svg: string) {
  const box = svg.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/);
  const width = Number(box?.[1] ?? 0);
  const height = Number(box?.[2] ?? 0);
  if (!width || !height) return svg;
  const frame = width * 0.24;
  const x = (width - frame) / 2;
  const y = (height - frame) / 2;
  const inset = frame * 0.14;
  const badge = `<rect x="${x}" y="${y}" width="${frame}" height="${frame}" rx="${frame * 0.18}" fill="#ffffff"/>
    <g transform="translate(${x + inset} ${y + inset})">${logoMark(frame - inset * 2)}</g>`;
  return svg.replace("</svg>", `${badge}</svg>`);
}

export function vehicleQrSvg(url = vehiclePayUrl()) {
  return QRCode.toString(url, { ...mark, type: "svg" }).then(withCenterLogo);
}

export async function vehicleScanCardSvg(url = vehiclePayUrl()) {
  const qr = await vehicleQrSvg(url);
  const viewBox = qr.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100";
  const inner = qr.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const host = escapeXml(url.replace(/^https:\/\//, ""));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="148mm" height="210mm" viewBox="0 0 560 800">
  <rect width="560" height="800" fill="#ffffff"/>
  <rect width="560" height="214" fill="#4C102C"/>
  <rect y="214" width="560" height="8" fill="#D6A000"/>
  <g transform="translate(252 36)">${logoMark(56)}</g>
  <text x="280" y="128" text-anchor="middle" fill="#F6F1DC" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" letter-spacing="8">ROVEYA</text>
  <text x="280" y="156" text-anchor="middle" fill="#E0B23A" font-family="Arial, Helvetica, sans-serif" font-size="11" letter-spacing="2.4">PREMIUM TAXIPOOL AND TRAVEL</text>
  <text x="280" y="268" text-anchor="middle" fill="#12060D" font-family="Georgia, 'Times New Roman', serif" font-size="28">“Travel better.</text>
  <text x="280" y="304" text-anchor="middle" fill="#12060D" font-family="Georgia, 'Times New Roman', serif" font-size="28">Arrive better.”</text>
  <svg x="100" y="332" width="360" height="360" viewBox="${viewBox}">${inner}</svg>
  <text x="280" y="724" text-anchor="middle" fill="#6B1838" font-family="Georgia, 'Times New Roman', serif" font-size="20">“Pay from your seat.”</text>
  <text x="280" y="752" text-anchor="middle" fill="#12060D" font-family="Arial, Helvetica, sans-serif" font-size="12">Point your camera here. No app is needed.</text>
  <text x="280" y="778" text-anchor="middle" fill="#12060D" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700">${host}</text>
</svg>`;
}

export function vehicleQrPng(url = vehiclePayUrl()) {
  return QRCode.toBuffer(url, { ...mark, width: 1600, type: "png" });
}
