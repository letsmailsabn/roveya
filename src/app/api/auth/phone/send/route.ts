import { issuePhoneOtp } from "@/lib/phone-otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const digits = String(body?.phone ?? "").replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return Response.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  }
  const code = issuePhoneOtp(digits);
  return Response.json({ ok: true, phone: digits, code });
}
