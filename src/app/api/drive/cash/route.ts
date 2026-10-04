import { createStaffClient } from "@/lib/supabase/server";
import { driverMobile, listDriverCash } from "@/lib/services/cash";
import { toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    const supabase = await createStaffClient();
    const { data } = await supabase.auth.getUser();
    const mobile = driverMobile(data.user?.phone ?? "");
    if (!mobile) return jsonError("Sign in with your driver mobile.", 401);
    const desk = await listDriverCash(mobile);
    if (!desk) return jsonError("This phone is not a hired ROVEYA driver.", 403);
    return Response.json(desk);
  } catch (error) {
    return toErrorResponse(error);
  }
}
