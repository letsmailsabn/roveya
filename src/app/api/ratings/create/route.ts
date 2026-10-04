import { submitRating } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";
import { feedbackSchema } from "@/lib/validation";
import { fromZod, jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = feedbackSchema.extend({ publicId: z.string().trim().min(4).max(40) }).strict();

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "rating"), 8, 60_000);
  if (!limited.ok) return jsonError("Too many requests", 429);
  try {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    return Response.json(await submitRating(parsed.data.publicId, parsed.data.rating, parsed.data.feedback));
  } catch (error) {
    return toErrorResponse(error);
  }
}
