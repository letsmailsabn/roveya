import { jsonError } from "@/lib/http";

export async function POST() {
  return jsonError("This payment endpoint has been retired. Razorpay webhooks use /api/payments/razorpay/webhook.", 410);
}
