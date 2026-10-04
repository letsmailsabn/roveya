import { handleRazorpayWebhook } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const result = await handleRazorpayWebhook(rawBody, signature);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
