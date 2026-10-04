import { isAnalyticsEvent } from "@/lib/analytics";
import { jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "analytics"), 40, 60_000);
  if (!limited.ok) return jsonError("Too many requests", 429);
  const body = await request.json().catch(() => null);
  if (!isAnalyticsEvent(body?.event)) return jsonError("Unknown event");
  return Response.json({ ok: true });
}
