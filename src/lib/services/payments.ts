import "server-only";
import Razorpay from "razorpay";
import { createRideRecord } from "@/lib/domain/create-ride";
import { nextPaymentState, rideStatusForPayment, settlementFromVerification } from "@/lib/domain/payment-state";
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "@/lib/domain/signature";
import { AppError, logServerError } from "@/lib/errors";
import { toPaise } from "@/lib/fare";
import { createServiceClient } from "@/lib/supabase/service";
import type { StaffSession } from "@/lib/auth";
import { isLocalAdminEnabled } from "@/lib/dev-mode";
import { devConfirmCash, devCreateRide, devGetRide, devStartCash } from "@/lib/dev-store";

type RideRow = {
  id: string;
  ride_id: string;
  customer_id: string;
  destination_id: string;
  number_of_seats: number;
  fare_per_seat: number;
  total_amount: number;
  status: string;
  customers: { name: string; mobile: string } | { name: string; mobile: string }[] | null;
  destinations: { name: string } | { name: string }[] | null;
  payments?: PaymentRow[] | null;
};

type PaymentRow = {
  id: string;
  ride_id: string;
  method: "RAZORPAY" | "CASH";
  amount: number;
  status: "CREATED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at?: string;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function latestPayment(payments: PaymentRow[] | null | undefined) {
  if (!payments?.length) return null;
  return [...payments].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))[0];
}

export function mapRide(row: RideRow, extras?: { keyId?: string | null; orderId?: string | null }) {
  const customer = one(row.customers);
  const destination = one(row.destinations);
  const payment = latestPayment(row.payments);
  return {
    publicId: row.ride_id,
    customerName: customer?.name ?? "",
    mobile: customer?.mobile ?? "",
    seats: row.number_of_seats,
    destinationName: destination?.name ?? "",
    farePerSeat: row.fare_per_seat,
    totalFare: row.total_amount,
    paymentMethod: payment?.method ?? null,
    paymentStatus: row.status === "PAID" ? "PAID" : row.status === "PAYMENT_FAILED" || row.status === "CANCELLED" ? "FAILED" : "PENDING",
    rideStatus: row.status,
    razorpayOrderId: extras?.orderId ?? payment?.razorpay_order_id ?? null,
    keyId: extras?.keyId ?? null,
  };
}

const rideSelect = `
  id, ride_id, customer_id, destination_id, number_of_seats, fare_per_seat, total_amount, status,
  customers ( name, mobile ),
  destinations ( name ),
  payments ( id, ride_id, method, amount, status, razorpay_order_id, razorpay_payment_id, created_at )
`;

async function loadRide(publicId: string) {
  const db = createServiceClient();
  const { data, error } = await db.from("rides").select(rideSelect).eq("ride_id", publicId).maybeSingle();
  if (error) {
    logServerError("load-ride", error);
    throw new AppError("Unable to load this ride.", 500);
  }
  if (!data) throw new AppError("Ride not found", 404);
  return data as unknown as RideRow;
}

async function writeAudit(entry: {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
}) {
  try {
    const db = createServiceClient();
    await db.from("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      old_data: entry.oldData ?? null,
      new_data: entry.newData ?? null,
    });
  } catch (error) {
    logServerError("audit", error);
  }
}

function razorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, client: new Razorpay({ key_id: keyId, key_secret: keySecret }) };
}

export async function createRide(input: { name: string; mobile: string; seats: number; destinationId: string }) {
  if (isLocalAdminEnabled()) return devCreateRide(input);
  const db = createServiceClient();
  const ride = await createRideRecord(input, {
    async getDestination(id) {
      const { data, error } = await db
        .from("destinations")
        .select("id,name,fare_per_seat,is_active")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        logServerError("destination", error);
        throw new AppError("Unable to create the ride.", 500);
      }
      if (!data) return null;
      return { id: data.id, name: data.name, farePerSeat: data.fare_per_seat, active: data.is_active };
    },
    async upsertCustomer(customer) {
      const { data, error } = await db
        .from("customers")
        .upsert({ name: customer.name, mobile: customer.mobile }, { onConflict: "mobile" })
        .select("id,name,mobile")
        .single();
      if (error || !data) {
        logServerError("customer", error);
        throw new AppError("Unable to save the passenger.", 500);
      }
      return data;
    },
    async nextRideCode() {
      const { data, error } = await db.rpc("next_ride_code");
      if (error || typeof data !== "string") {
        logServerError("ride-code", error);
        throw new AppError("Unable to create the ride.", 500);
      }
      return data;
    },
    async insertRide(next) {
      const { error } = await db.from("rides").insert({
        ride_id: next.rideCode,
        customer_id: next.customerId,
        destination_id: next.destinationId,
        number_of_seats: next.seats,
        fare_per_seat: next.farePerSeat,
        total_amount: next.totalAmount,
        status: "CREATED",
      });
      if (error) {
        logServerError("insert-ride", error);
        throw new AppError("Unable to create the ride.", 500);
      }
      return next;
    },
  });

  return {
    publicId: ride.rideCode,
    customerName: input.name.trim(),
    mobile: input.mobile,
    seats: ride.seats,
    destinationName: ride.destinationName,
    farePerSeat: ride.farePerSeat,
    totalFare: ride.totalAmount,
    paymentMethod: null,
    paymentStatus: "PENDING",
    rideStatus: "CREATED",
  };
}

export async function getRide(publicId: string) {
  if (isLocalAdminEnabled()) return devGetRide(publicId);
  const row = await loadRide(publicId);
  const view = mapRide(row);
  return {
    publicId: view.publicId,
    seats: view.seats,
    destinationName: view.destinationName,
    farePerSeat: view.farePerSeat,
    totalFare: view.totalFare,
    paymentMethod: view.paymentMethod,
    paymentStatus: view.paymentStatus,
    rideStatus: view.rideStatus,
  };
}

export async function startCashPayment(publicId: string) {
  if (isLocalAdminEnabled()) return devStartCash(publicId);
  const row = await loadRide(publicId);
  if (row.status === "PAID") throw new AppError("This ride is already paid.");
  if (row.status === "CASH_PENDING") return mapRide(row);
  const pendingOnline = (row.payments ?? []).find((payment) => payment.method === "RAZORPAY" && payment.status === "PENDING");
  if (pendingOnline) throw new AppError("Online payment is already in progress for this ride.");

  const db = createServiceClient();
  const { error } = await db.from("payments").insert({
    ride_id: row.id,
    method: "CASH",
    amount: row.total_amount,
    status: "PENDING",
  });
  if (error) {
    logServerError("cash-payment", error);
    throw new AppError("Unable to start cash payment.", 500);
  }
  await db.from("rides").update({ status: "CASH_PENDING" }).eq("id", row.id);
  const next = await loadRide(publicId);
  return mapRide(next);
}

export async function createRazorpayOrder(publicId: string) {
  const gateway = razorpayClient();
  if (!gateway) throw new AppError("Online payment is not configured.", 503);

  const row = await loadRide(publicId);
  if (row.status === "PAID") throw new AppError("This ride is already paid.");
  if (row.status === "CASH_PENDING") throw new AppError("This ride is waiting for cash confirmation.");

  const existing = (row.payments ?? []).find((payment) => payment.method === "RAZORPAY");
  if (existing?.status === "PENDING" && existing.razorpay_order_id) {
    return mapRide(row, { keyId: gateway.keyId, orderId: existing.razorpay_order_id });
  }

  const db = createServiceClient();
  let paymentId = existing?.id;
  if (!paymentId) {
    const inserted = await db
      .from("payments")
      .insert({ ride_id: row.id, method: "RAZORPAY", amount: row.total_amount, status: "CREATED" })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) {
      logServerError("payment-insert", inserted.error);
      throw new AppError("Unable to start online payment.", 500);
    }
    paymentId = inserted.data.id;
  }

  let orderId: string;
  try {
    const order = await gateway.client.orders.create({
      amount: toPaise(row.total_amount),
      currency: "INR",
      receipt: row.ride_id,
      notes: { ride_id: row.ride_id },
    });
    orderId = order.id;
  } catch (error) {
    logServerError("razorpay-order", error);
    await db.from("payments").update({ status: "FAILED" }).eq("id", paymentId);
    await db.from("rides").update({ status: "PAYMENT_FAILED" }).eq("id", row.id);
    throw new AppError("Payment could not be started. Please try again.", 502);
  }

  const updated = await db
    .from("payments")
    .update({ status: "PENDING", razorpay_order_id: orderId })
    .eq("id", paymentId)
    .select("id")
    .single();
  if (updated.error) {
    logServerError("payment-order", updated.error);
    throw new AppError("Payment could not be started. Please try again.", 502);
  }
  await db.from("rides").update({ status: "PAYMENT_PENDING" }).eq("id", row.id);
  const next = await loadRide(publicId);
  return mapRide(next, { keyId: gateway.keyId, orderId });
}

async function markRazorpayPaid(input: {
  orderId: string;
  paymentId: string;
  signature: string | null;
  amountPaise: number;
}) {
  const db = createServiceClient();
  const { data: payment, error } = await db
    .from("payments")
    .select("id,ride_id,amount,status,method,razorpay_order_id")
    .eq("razorpay_order_id", input.orderId)
    .maybeSingle();
  if (error || !payment) throw new AppError("Payment could not be verified.");
  if (payment.method !== "RAZORPAY") throw new AppError("Payment could not be verified.");
  if (toPaise(payment.amount) !== input.amountPaise) {
    logServerError("amount-mismatch", new Error("Razorpay amount did not match the stored fare"));
    throw new AppError("Payment could not be verified.");
  }

  const transition = nextPaymentState(payment.status, "captured");
  if (transition.duplicate) return { duplicate: true, rideId: payment.ride_id as string };

  const { data: changed } = await db
    .from("payments")
    .update({
      status: "PAID",
      razorpay_payment_id: input.paymentId,
      razorpay_signature: input.signature,
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .in("status", ["CREATED", "PENDING", "FAILED"])
    .select("id");

  if (!changed?.length) return { duplicate: true, rideId: payment.ride_id as string };

  await db.from("rides").update({ status: rideStatusForPayment("PAID", "RAZORPAY") }).eq("id", payment.ride_id);
  await writeAudit({
    userId: null,
    action: "payment.paid",
    entity: "payments",
    entityId: payment.id,
    oldData: { status: payment.status },
    newData: { status: "PAID", razorpay_payment_id: input.paymentId },
  });
  return { duplicate: false, rideId: payment.ride_id as string };
}

export async function verifyRazorpayPayment(input: {
  publicId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const gateway = razorpayClient();
  if (!gateway) throw new AppError("Online payment is not configured.", 503);

  const signatureOk = verifyRazorpayPaymentSignature({
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
    keySecret: gateway.keySecret,
  });
  if (!signatureOk) throw new AppError("Payment could not be verified.");

  const row = await loadRide(input.publicId);
  const payment = (row.payments ?? []).find((item) => item.razorpay_order_id === input.orderId);
  if (!payment) throw new AppError("Payment could not be verified.");

  let captured = false;
  let amountMatches = false;
  try {
    let remote = await gateway.client.payments.fetch(input.paymentId);
    if (remote.status === "authorized") {
      remote = await gateway.client.payments.capture(input.paymentId, toPaise(row.total_amount), "INR");
    }
    captured = remote.status === "captured";
    amountMatches = Number(remote.amount) === toPaise(row.total_amount) && remote.order_id === input.orderId;
  } catch (error) {
    logServerError("razorpay-fetch", error);
    throw new AppError("Payment could not be verified.", 502);
  }

  const decision = settlementFromVerification({
    signatureOk,
    captured,
    amountMatches,
    alreadyPaid: payment.status === "PAID",
  });
  if (decision === "REJECTED") throw new AppError("Payment could not be verified.");

  await markRazorpayPaid({
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
    amountPaise: toPaise(row.total_amount),
  });
  return getRide(input.publicId);
}

export async function handleRazorpayWebhook(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !verifyRazorpayWebhookSignature(rawBody, signatureHeader, secret)) {
    throw new AppError("Unauthorized", 401);
  }

  let body: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } };
      order?: { entity?: { id?: string; amount_paid?: number } };
    };
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new AppError("Invalid webhook payload.");
  }

  const event = body.event ?? "";
  const paymentEntity = body.payload?.payment?.entity;
  const orderEntity = body.payload?.order?.entity;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  const paymentId = paymentEntity?.id;
  const amount = paymentEntity?.amount ?? orderEntity?.amount_paid;
  if (!orderId) return { ok: true, ignored: true };

  const success = event === "payment.captured" || event === "order.paid";
  const failed = event === "payment.failed";
  const refunded = event === "refund.processed";
  if (!success && !failed && !refunded) return { ok: true, ignored: true };

  const db = createServiceClient();
  const { data: payment } = await db
    .from("payments")
    .select("id,ride_id,amount,status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (!payment) {
    logServerError("webhook-missing", new Error("No payment for Razorpay order"));
    return { ok: true, ignored: true };
  }

  if (typeof amount === "number" && amount !== toPaise(payment.amount)) {
    logServerError("webhook-amount", new Error("Webhook amount did not match the stored fare"));
    return { ok: true, ignored: true };
  }

  if (success) {
    if (!paymentId || typeof amount !== "number") return { ok: true, ignored: true };
    const result = await markRazorpayPaid({
      orderId,
      paymentId,
      signature: null,
      amountPaise: amount,
    });
    return { ok: true, duplicate: result.duplicate };
  }

  const kind = failed ? "failed" : "refunded";
  const transition = nextPaymentState(payment.status, kind);
  if (transition.duplicate) return { ok: true, duplicate: true };

  await db.from("payments").update({ status: transition.status, razorpay_payment_id: paymentId ?? null }).eq("id", payment.id);
  await db.from("rides").update({ status: rideStatusForPayment(transition.status, "RAZORPAY") }).eq("id", payment.ride_id);
  await writeAudit({
    userId: null,
    action: failed ? "payment.failed" : "payment.refunded",
    entity: "payments",
    entityId: payment.id,
    oldData: { status: payment.status },
    newData: { status: transition.status, event },
  });
  return { ok: true, duplicate: false };
}

export async function confirmCashPayment(publicId: string, staff: StaffSession) {
  if (isLocalAdminEnabled()) return devConfirmCash(publicId, staff);
  const row = await loadRide(publicId);
  const cash = (row.payments ?? []).find((payment) => payment.method === "CASH");
  if (!cash || row.status !== "CASH_PENDING") throw new AppError("This ride is not waiting for cash confirmation.");
  if (cash.status === "PAID") return mapRide(row);

  const db = createServiceClient();
  const { data: changed } = await db
    .from("payments")
    .update({ status: "PAID", paid_at: new Date().toISOString() })
    .eq("id", cash.id)
    .eq("status", "PENDING")
    .select("id");
  if (!changed?.length) throw new AppError("Cash payment could not be confirmed.");
  await db.from("rides").update({ status: "PAID" }).eq("id", row.id);
  await writeAudit({
    userId: staff.id,
    action: "ride.cash_confirmed",
    entity: "rides",
    entityId: row.id,
    oldData: { status: row.status },
    newData: { status: "PAID", confirmed_by: staff.id },
  });
  return getRide(publicId);
}

export async function submitRating(publicId: string, stars: number, feedback: string) {
  const row = await loadRide(publicId);
  if (row.status !== "PAID") throw new AppError("Feedback is available after payment is confirmed.");
  const db = createServiceClient();
  const existing = await db.from("ratings").select("id").eq("ride_id", row.id).maybeSingle();
  if (existing.data) throw new AppError("Feedback already submitted.");

  const { error } = await db.from("ratings").insert({
    ride_id: row.id,
    stars,
    feedback: feedback.trim() ? feedback.trim() : null,
  });
  if (error) {
    logServerError("rating", error);
    throw new AppError("Unable to save feedback.", 500);
  }

  const quote = feedback.trim();
  if (stars === 5 && quote.length >= 24) {
    const customer = one(row.customers);
    const destination = one(row.destinations);
    await db.from("testimonials").insert({
      name: customer?.name.split(" ")[0] || "Guest",
      route: destination?.name ?? null,
      rating: stars,
      quote,
      published: false,
    });
  }

  await writeAudit({
    userId: null,
    action: "rating.created",
    entity: "ratings",
    entityId: row.id,
    newData: { stars },
  });
  return { ok: true };
}
