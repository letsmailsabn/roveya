import { NextRequest } from "next/server";
import { createStaffClient } from "@/lib/supabase/server";
import { decideDriverCash, driverMobile } from "@/lib/services/cash";
import { toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(clientKey(request, "driver-cash"), 20, 60_000);
  if (!limited.ok) return jsonError("Too many requests. Please wait a moment.", 429);
  try {
    const supabase = await createStaffClient();
    const { data } = await supabase.auth.getUser();
    const mobile = driverMobile(data.user?.phone ?? "");
    if (!mobile) return jsonError("Sign in with your driver mobile.", 401);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { decision?: string } | null;
    const decision = body?.decision === "decline" ? "DECLINED" : "ACCEPTED";
    await decideDriverCash(mobile, id, decision);
    return Response.json({ ok: true, status: decision });
  } catch (error) {
    return toErrorResponse(error);
  }
}
