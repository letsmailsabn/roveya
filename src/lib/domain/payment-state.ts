export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentEvent = "captured" | "failed" | "refunded";

export function nextPaymentState(current: PaymentStatus, event: PaymentEvent) {
  if (current === "PAID") return { status: "PAID" as const, duplicate: true };
  if (current === "REFUNDED") return { status: "REFUNDED" as const, duplicate: true };
  if (event === "captured") return { status: "PAID" as const, duplicate: false };
  if (event === "failed") return { status: "FAILED" as const, duplicate: current === "FAILED" };
  return { status: "REFUNDED" as const, duplicate: false };
}

export function rideStatusForPayment(status: PaymentStatus, method: "RAZORPAY" | "CASH") {
  if (status === "PAID") return "PAID";
  if (status === "FAILED") return "PAYMENT_FAILED";
  if (status === "REFUNDED") return "CANCELLED";
  if (method === "CASH") return "CASH_PENDING";
  return "PAYMENT_PENDING";
}

export type VerificationInput = {
  signatureOk: boolean;
  captured: boolean;
  amountMatches: boolean;
  alreadyPaid: boolean;
};

export function settlementFromVerification(input: VerificationInput) {
  if (input.alreadyPaid && input.signatureOk && input.amountMatches) return "PAID";
  if (!input.signatureOk || !input.captured || !input.amountMatches) return "REJECTED";
  return "PAID";
}

export function clientPaymentStatus(rideStatus: string): "PENDING" | "PAID" | "FAILED" {
  if (rideStatus === "PAID") return "PAID";
  if (rideStatus === "PAYMENT_FAILED" || rideStatus === "CANCELLED") return "FAILED";
  return "PENDING";
}
