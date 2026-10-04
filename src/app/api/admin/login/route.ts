import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { createStaffClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";
import { fromZod, jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { toErrorResponse } from "@/lib/errors";
import { isLocalAdminEnabled, localAdminEmail, localAdminPassword, LOCAL_ADMIN_COOKIE, LOCAL_ADMIN_TOKEN } from "@/lib/dev-mode";

function sameSecret(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "login"), 8, 15 * 60_000);
  if (!limited.ok) return jsonError("Too many attempts", 429);
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);

    if (isLocalAdminEnabled()) {
      const emailOk = sameSecret(parsed.data.email.toLowerCase(), localAdminEmail());
      const passwordOk = sameSecret(parsed.data.password, localAdminPassword());
      if (!emailOk || !passwordOk) return jsonError("Invalid credentials", 401);
      const jar = await cookies();
      jar.set(LOCAL_ADMIN_COOKIE, LOCAL_ADMIN_TOKEN, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      return Response.json({ ok: true, name: "ROVEYA CEO", role: "CEO" });
    }

    const supabase = await createStaffClient();
    const signedIn = await supabase.auth.signInWithPassword({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
    });
    if (signedIn.error || !signedIn.data.user) return jsonError("Invalid credentials", 401);

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id,role,name")
      .eq("auth_user_id", signedIn.data.user.id)
      .maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      return jsonError("This account is not authorised for ROVEYA operations.", 403);
    }
    return Response.json({ ok: true, name: admin.name, role: admin.role });
  } catch (error) {
    return toErrorResponse(error);
  }
}
