import { startCashPayment } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";
import { fromZod, jsonError } from "@/lib/http";
import { paymentMethodSchema } from "@/lib/validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  const limited = rateLimit(clientKey(request, "pay"), 20, 60_000);
  if (!limited.ok) return jsonError("Too many requests", 429);

  try {
    const { publicId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = paymentMethodSchema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    if (parsed.data.method === "ONLINE") {
      return jsonError("Online payment opens in Razorpay. Please choose Pay online again.");
    }
    return Response.json(await startCashPayment(publicId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
