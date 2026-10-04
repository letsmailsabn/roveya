import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";
import { isLocalAdminEnabled } from "@/lib/dev-mode";
import { devAddMessage } from "@/lib/dev-store";
import { contactSchema } from "@/lib/validation";
import { fromZod, jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { logServerError, toErrorResponse } from "@/lib/errors";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "contact"), 6, 10 * 60_000);
  if (!limited.ok) return jsonError("Too many messages. Please try later.", 429);
  try {
    const body = await request.json().catch(() => null);
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    if (isLocalAdminEnabled()) {
      devAddMessage({
        name: parsed.data.name,
        mobile: parsed.data.mobile,
        email: parsed.data.email || null,
        message: parsed.data.message,
      });
      return Response.json({ ok: true });
    }
    if (!isSupabaseConfigured()) return jsonError("Messages are not available yet.", 503);
    const db = createServiceClient();
    const { error } = await db.from("contact_messages").insert({
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      email: parsed.data.email || null,
      message: parsed.data.message,
    });
    if (error) {
      logServerError("contact", error);
      return jsonError("Unable to send your message.", 500);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
