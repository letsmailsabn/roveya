import { isAnalyticsEvent } from "@/lib/analytics";
import { logServerError } from "@/lib/errors";
import { jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "analytics"), 40, 60_000);
  if (!limited.ok) return jsonError("Too many requests", 429);
  const body = await request.json().catch(() => null);
  if (!isAnalyticsEvent(body?.event)) return jsonError("Unknown event");
  if (!isSupabaseConfigured()) return Response.json({ ok: true });

  const db = createServiceClient();
  const { error } = await db.from("audit_logs").insert({
    user_id: null,
    action: "analytics.recorded",
    entity: "analytics",
    entity_id: body.event,
    new_data: { event: body.event },
  });
  if (error) logServerError("analytics", error);
  return Response.json({ ok: true });
}
