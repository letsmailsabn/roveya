import { NextRequest } from "next/server";
import { verifyRazorpayPayment } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { verifyPaymentSchema } from "@/lib/validation";
import { fromZod, jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "razorpay-verify"), 20, 60_000);
  if (!limited.ok) return jsonError("Too many requests. Please wait a moment.", 429);
  try {
    const body = await request.json().catch(() => null);
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    const ride = await verifyRazorpayPayment({
      publicId: parsed.data.publicId,
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
    });
    return Response.json(ride);
  } catch (error) {
    return toErrorResponse(error);
  }
}
