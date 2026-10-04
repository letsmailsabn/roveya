import assert from "node:assert/strict";
import { createHmac } from "crypto";
import test from "node:test";
import { calculateFare, toPaise } from "../src/lib/fare";
import { createRideRecord, type NewRide, type RideRepository } from "../src/lib/domain/create-ride";
import { nextPaymentState, settlementFromVerification } from "../src/lib/domain/payment-state";
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "../src/lib/domain/signature";
import { assertCanConfirmCash, assertCeo, assertStaff } from "../src/lib/domain/authz";
import { createRideSchema, feedbackSchema, verifyPaymentSchema } from "../src/lib/validation";
import { AppError } from "../src/lib/errors";

test("fare is fare per seat times seats", () => {
  assert.equal(calculateFare(450, 3), 1350);
  assert.equal(calculateFare(500, 4), 2000);
  assert.equal(toPaise(2000), 200000);
});

test("seat count and fare are rejected when invalid", () => {
  assert.throws(() => calculateFare(500, 0));
  assert.throws(() => calculateFare(0, 2));
  assert.throws(() => calculateFare(500, 1.5));
});

test("ride creation ignores any client amount and snapshots the fare", async () => {
  const destinations = [{ id: "11111111-1111-1111-1111-111111111111", name: "Hyderabad", farePerSeat: 500, active: true }];
  const customers = new Map<string, { id: string; name: string; mobile: string }>();
  const rides: NewRide[] = [];
  const repo: RideRepository = {
    async getDestination(id: string) {
      return destinations.find((item) => item.id === id) ?? null;
    },
    async upsertCustomer(input: { name: string; mobile: string }) {
      const existing = customers.get(input.mobile);
      if (existing) {
        existing.name = input.name;
        return existing;
      }
      const created = { id: `customer-${customers.size + 1}`, ...input };
      customers.set(input.mobile, created);
      return created;
    },
    async nextRideCode() {
      return `RV-2026-${String(rides.length + 1).padStart(6, "0")}`;
    },
    async insertRide(ride) {
      rides.push(ride);
      return ride;
    },
  };

  const first = await createRideRecord(
    { name: "Ravi", mobile: "9876543210", seats: 2, destinationId: destinations[0].id },
    repo,
  );
  assert.equal(first.farePerSeat, 500);
  assert.equal(first.totalAmount, 1000);
  assert.equal(first.rideCode, "RV-2026-000001");

  destinations[0].farePerSeat = 550;
  const second = await createRideRecord(
    { name: "Ravi Kumar", mobile: "9876543210", seats: 2, destinationId: destinations[0].id },
    repo,
  );
  assert.equal(customers.size, 1);
  assert.equal(second.customerId, first.customerId);
  assert.equal(rides[0].farePerSeat, 500);
  assert.equal(rides[0].totalAmount, 1000);
  assert.equal(second.farePerSeat, 550);
  assert.equal(second.totalAmount, 1100);
});

test("inactive or unknown destinations are rejected", async () => {
  const repo = {
    async getDestination() {
      return { id: "x", name: "Hyderabad", farePerSeat: 500, active: false };
    },
    async upsertCustomer() {
      throw new Error("should not create a customer");
    },
    async nextRideCode() {
      return "RV-2026-000001";
    },
    async insertRide<T>(ride: T) {
      return ride;
    },
  };
  await assert.rejects(
    () => createRideRecord({ name: "Ravi", mobile: "9876543210", seats: 1, destinationId: "missing" }, repo),
    (error: unknown) => error instanceof AppError && error.message === "Destination is not available.",
  );
});

test("the browser cannot submit a total amount", () => {
  const parsed = createRideSchema.safeParse({
    name: "Ravi",
    mobile: "9876543210",
    seats: 2,
    destinationId: "11111111-1111-1111-1111-111111111111",
    total_amount: 1,
  });
  assert.equal(parsed.success, false);
});

test("invalid mobile numbers are rejected", () => {
  const parsed = createRideSchema.safeParse({
    name: "Ravi",
    mobile: "12345",
    seats: 1,
    destinationId: "11111111-1111-1111-1111-111111111111",
  });
  assert.equal(parsed.success, false);
});

test("razorpay signatures accept the official digest and reject tampering", () => {
  const secret = "test_secret";
  const orderId = "order_123";
  const paymentId = "pay_123";
  const signature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  assert.equal(verifyRazorpayPaymentSignature({ orderId, paymentId, signature, keySecret: secret }), true);
  assert.equal(verifyRazorpayPaymentSignature({ orderId, paymentId, signature: `${signature}aa`, keySecret: secret }), false);
  assert.equal(verifyRazorpayPaymentSignature({ orderId, paymentId, signature, keySecret: "other" }), false);
});

test("webhook signatures are verified against the raw body", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "payment.captured" });
  const header = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyRazorpayWebhookSignature(body, header, secret), true);
  assert.equal(verifyRazorpayWebhookSignature(body, header, "wrong"), false);
  assert.equal(verifyRazorpayWebhookSignature(body, null, secret), false);
});

test("payment verification rejects a frontend success claim without proof", () => {
  assert.equal(
    settlementFromVerification({ signatureOk: false, captured: true, amountMatches: true, alreadyPaid: false }),
    "REJECTED",
  );
  assert.equal(
    settlementFromVerification({ signatureOk: true, captured: true, amountMatches: false, alreadyPaid: false }),
    "REJECTED",
  );
  assert.equal(
    settlementFromVerification({ signatureOk: true, captured: false, amountMatches: true, alreadyPaid: false }),
    "REJECTED",
  );
  const claimed = verifyPaymentSchema.safeParse({
    publicId: "RV-2026-000001",
    razorpay_order_id: "order_123",
    razorpay_payment_id: "pay_123",
    razorpay_signature: "signature",
    status: "PAID",
  });
  assert.equal(claimed.success, false);
});

test("a valid captured payment is accepted", () => {
  assert.equal(
    settlementFromVerification({ signatureOk: true, captured: true, amountMatches: true, alreadyPaid: false }),
    "PAID",
  );
});

test("duplicate and failed webhooks do not corrupt a paid ride", () => {
  assert.deepEqual(nextPaymentState("PAID", "captured"), { status: "PAID", duplicate: true });
  assert.deepEqual(nextPaymentState("PAID", "failed"), { status: "PAID", duplicate: true });
  assert.deepEqual(nextPaymentState("PENDING", "failed"), { status: "FAILED", duplicate: false });
  assert.deepEqual(nextPaymentState("FAILED", "failed"), { status: "FAILED", duplicate: true });
  assert.deepEqual(nextPaymentState("PENDING", "captured"), { status: "PAID", duplicate: false });
});

test("staff roles are enforced on the server", () => {
  assert.equal(assertStaff("ADMIN"), "ADMIN");
  assert.equal(assertStaff("CEO"), "CEO");
  assert.equal(assertCeo("CEO"), "CEO");
  assert.throws(() => assertCeo("ADMIN"), (error: unknown) => error instanceof AppError && error.status === 403);
  assert.throws(() => assertStaff("CUSTOMER"));
  assert.throws(() => assertStaff(null));
  assert.equal(assertCanConfirmCash("ADMIN"), "ADMIN");
  assert.throws(() => assertCanConfirmCash("CUSTOMER"));
});

test("ratings only allow 1 to 5 stars", () => {
  assert.equal(feedbackSchema.safeParse({ rating: 5, feedback: "Smooth journey" }).success, true);
  assert.equal(feedbackSchema.safeParse({ rating: 0, feedback: "" }).success, false);
  assert.equal(feedbackSchema.safeParse({ rating: 6, feedback: "" }).success, false);
});
