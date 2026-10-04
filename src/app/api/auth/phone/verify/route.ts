import { checkPhoneOtp } from "@/lib/phone-otp";
import { createStaffClient } from "@/lib/supabase/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const digits = String(body?.phone ?? "").replace(/\D/g, "").slice(-10);
  const code = String(body?.code ?? "");
  if (!/^[6-9]\d{9}$/.test(digits) || !/^\d{6}$/.test(code)) {
    return Response.json({ error: "Enter the mobile number and the 6-digit code." }, { status: 400 });
  }
  const invalid = checkPhoneOtp(digits, code);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const admin = createServiceClient();
  const email = `${digits}@phone.roveya.app`;
  const created = await admin.auth.admin.createUser({
    email,
    phone: `+91${digits}`,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { name: "Traveller", mobile: digits },
  });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) {
    return Response.json({ error: created.error.message }, { status: 400 });
  }

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) {
    return Response.json({ error: link.error?.message ?? "Unable to open the account." }, { status: 400 });
  }

  const session = await createStaffClient();
  const verified = await session.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (verified.error || !verified.data.user) {
    return Response.json({ error: verified.error?.message ?? "Unable to sign in." }, { status: 400 });
  }

  const userId = verified.data.user.id;
  const existing = await admin.from("customer_profiles").select("id").eq("auth_user_id", userId).maybeSingle();
  if (!existing.error && !existing.data) {
    await admin.from("customer_profiles").insert({ auth_user_id: userId, name: "Traveller", mobile: digits });
  }

  return Response.json({ ok: true, phone: digits });
}
