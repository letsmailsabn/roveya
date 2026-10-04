import { submitRating } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";
import { feedbackSchema } from "@/lib/validation";
import { fromZod, jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

async function save(request: Request, publicId: string) {
  const limited = rateLimit(clientKey(request, "rating"), 8, 60_000);
  if (!limited.ok) return jsonError("Too many requests", 429);
  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  return Response.json(await submitRating(publicId, parsed.data.rating, parsed.data.feedback));
}

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await context.params;
    return await save(request, publicId);
  } catch (error) {
    return toErrorResponse(error);
  }
}
