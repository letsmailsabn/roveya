import { cookies } from "next/headers";
import { createStaffClient } from "@/lib/supabase/server";
import { toErrorResponse } from "@/lib/errors";
import { isLocalAdminEnabled, LOCAL_ADMIN_COOKIE } from "@/lib/dev-mode";

export async function POST() {
  try {
    if (isLocalAdminEnabled()) {
      const jar = await cookies();
      jar.delete(LOCAL_ADMIN_COOKIE);
      return Response.json({ ok: true });
    }
    const supabase = await createStaffClient();
    await supabase.auth.signOut();
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
