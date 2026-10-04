import { NextResponse, type NextRequest } from "next/server";
import { createStaffClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createStaffClient();
    const verified = await supabase.auth.exchangeCodeForSession(code);
    const user = verified.data.user;
    if (user) {
      const meta = user.user_metadata ?? {};
      const fetched = String(meta.full_name || meta.name || "").trim();
      await supabase.from("customer_profiles").upsert(
        { auth_user_id: user.id, name: fetched || "Traveller", email: user.email },
        { onConflict: "auth_user_id" },
      );
    }
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
