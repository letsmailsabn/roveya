import { createHmac, timingSafeEqual } from "crypto";

function safeEqual(expected: string, received: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}) {
  const expected = createHmac("sha256", input.keySecret).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  return safeEqual(expected, input.signature);
}

export function verifyRazorpayWebhookSignature(rawBody: string, header: string | null, webhookSecret: string) {
  if (!header) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, header);
}
