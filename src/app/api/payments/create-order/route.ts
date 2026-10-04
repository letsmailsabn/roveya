import { NextRequest } from "next/server";
import { createRazorpayOrder } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validation";
import { fromZod, jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "razorpay-order"), 12, 60_000);
  if (!limited.ok) return jsonError("Too many requests. Please wait a moment.", 429);
  try {
    const body = await request.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    return Response.json(await createRazorpayOrder(parsed.data.publicId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
