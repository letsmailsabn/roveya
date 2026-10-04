import "server-only";
import { createHash, randomBytes } from "crypto";
import { AppError, logServerError } from "@/lib/errors";
import { createServiceClient } from "@/lib/supabase/service";
import { sendDriverSms } from "@/lib/sms";
import { publicOrigin } from "@/lib/vehicle-qr";

type DriverRow = { id: string; name: string; mobile: string };

export type CashPreview = {
  passenger: string;
  destination: string;
  seats: number;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
};

type OpenRide = {
  id: string;
  driver_id?: string | null;
  total_amount: number;
  number_of_seats: number;
  customers: { name: string } | { name: string }[] | null;
  destinations: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function acceptLink(token: string) {
  return `${publicOrigin()}/d/${token}`;
}

async function activeDriver(id: string) {
  const db = createServiceClient();
  const { data, error } = await db.from("drivers").select("id,name,mobile").eq("id", id).eq("is_active", true).maybeSingle();
  if (error || !data) return null;
  return data as DriverRow;
}

async function soleActiveDriver() {
  const db = createServiceClient();
  const { data, error } = await db.from("drivers").select("id,name,mobile").eq("is_active", true).limit(2);
  if (error || data?.length !== 1) return null;
  return data[0] as DriverRow;
}

export async function openDriverCash(ride: OpenRide) {
  const db = createServiceClient();
  let driver = ride.driver_id ? await activeDriver(ride.driver_id) : null;
  if (!driver) driver = await soleActiveDriver();
  if (!driver) {
    throw new AppError("Cash needs the driver for this vehicle. Scan the payment card in the car.");
  }

  if (ride.driver_id !== driver.id) {
    const saved = await db.from("rides").update({ driver_id: driver.id }).eq("id", ride.id);
    if (saved.error && !saved.error.message.includes("driver_id")) {
      logServerError("cash-driver", saved.error);
    }
  }

  const existing = await db
    .from("cash_confirmations")
    .select("id,sent_at")
    .eq("ride_id", ride.id)
    .eq("status", "PENDING")
    .maybeSingle();
  if (existing.error) {
    if (existing.error.message.includes("cash_confirmations")) {
      throw new AppError("Cash confirmation is not ready in the database yet.");
    }
    logServerError("cash-confirmation", existing.error);
    throw new AppError("Unable to reach the driver.", 500);
  }

  let sentAt = (existing.data?.sent_at as string | null | undefined) ?? null;
  const token = !existing.data || !sentAt ? randomBytes(18).toString("base64url") : "";
  if (!existing.data) {
    const inserted = await db.from("cash_confirmations").insert({
      ride_id: ride.id,
      driver_id: driver.id,
      token_hash: hashToken(token),
      status: "PENDING",
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    });
    if (inserted.error) {
      logServerError("cash-confirmation", inserted.error);
      throw new AppError("Unable to reach the driver.", 500);
    }
  } else if (!sentAt) {
    await db.from("cash_confirmations").update({ token_hash: hashToken(token) }).eq("id", existing.data.id);
  }
  if (token) {
    const passenger = one(ride.customers)?.name?.split(" ")[0] || "A passenger";
    const destination = (one(ride.destinations)?.name || "the ride").slice(0, 28);
    const sent = await sendDriverSms(
      driver.mobile,
      `ROVEYA cash Rs ${ride.total_amount} from ${passenger} for ${destination}. Accept: ${acceptLink(token)}`,
    );
    if (sent) {
      sentAt = new Date().toISOString();
      await db.from("cash_confirmations").update({ sent_at: sentAt }).eq("ride_id", ride.id).eq("status", "PENDING");
    }
  }

  return { driverName: driver.name, driverNotified: Boolean(sentAt) };
}

export async function applyCashDecision(input: {
  rideUuid: string;
  paymentId: string;
  decision: "ACCEPTED" | "DECLINED";
  requireConfirmation: boolean;
}) {
  const db = createServiceClient();
  const now = new Date().toISOString();
  if (input.requireConfirmation) {
    const locked = await db
      .from("cash_confirmations")
      .update({ status: input.decision, decided_at: now })
      .eq("ride_id", input.rideUuid)
      .eq("status", "PENDING")
      .gt("expires_at", now)
      .select("id");
    if (locked.error) {
      logServerError("cash-decision", locked.error);
      throw new AppError("Unable to record the driver's decision.", 500);
    }
    if (!locked.data?.length) throw new AppError("This cash request is no longer open.");
  } else {
    await db
      .from("cash_confirmations")
      .update({ status: input.decision, decided_at: now })
      .eq("ride_id", input.rideUuid)
      .eq("status", "PENDING");
  }

  const paid = input.decision === "ACCEPTED";
  const changed = await db
    .from("payments")
    .update({ status: paid ? "PAID" : "FAILED", paid_at: paid ? now : null })
    .eq("id", input.paymentId)
    .eq("status", "PENDING")
    .select("id");
  if (changed.error || !changed.data?.length) throw new AppError("This cash payment is no longer waiting.");
  const ride = await db.from("rides").update({ status: paid ? "PAID" : "PAYMENT_FAILED" }).eq("id", input.rideUuid);
  if (ride.error) {
    logServerError("cash-ride", ride.error);
    throw new AppError("Unable to record the payment.", 500);
  }
  if (input.requireConfirmation) {
    await db.from("audit_logs").insert({
      user_id: null,
      action: paid ? "ride.cash_confirmed" : "ride.cash_declined",
      entity: "rides",
      entity_id: input.rideUuid,
      new_data: { status: paid ? "PAID" : "PAYMENT_FAILED", via: "driver_phone" },
    });
  }
}

const confirmationSelect = `
  id, ride_id, driver_id, status, expires_at,
  rides ( total_amount, number_of_seats, customers ( name ), destinations ( name ) )
`;

type ConfirmationRide = {
  total_amount: number;
  number_of_seats: number;
  customers: { name: string } | { name: string }[] | null;
  destinations: { name: string } | { name: string }[] | null;
};

type ConfirmationRow = {
  id: string;
  ride_id: string;
  driver_id: string;
  status: string;
  expires_at: string;
  rides: ConfirmationRide | ConfirmationRide[] | null;
};

function previewFrom(row: ConfirmationRow): CashPreview {
  const ride = one(row.rides);
  const expired = row.status === "PENDING" && new Date(row.expires_at).getTime() < Date.now();
  return {
    passenger: one(ride?.customers)?.name || "Passenger",
    destination: one(ride?.destinations)?.name || "Ride",
    seats: ride?.number_of_seats ?? 1,
    amount: ride?.total_amount ?? 0,
    status: expired ? "EXPIRED" : (row.status as CashPreview["status"]),
  };
}

async function pendingCashPayment(rideId: string) {
  const db = createServiceClient();
  const { data } = await db.from("payments").select("id").eq("ride_id", rideId).eq("method", "CASH").eq("status", "PENDING").maybeSingle();
  return data?.id ?? null;
}

async function confirmationByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(token)) return null;
  const db = createServiceClient();
  const { data, error } = await db.from("cash_confirmations").select(confirmationSelect).eq("token_hash", hashToken(token)).maybeSingle();
  if (error) {
    logServerError("cash-link", error);
    return null;
  }
  if (!data) return null;
  return data as unknown as ConfirmationRow;
}

export async function readCashLink(token: string): Promise<CashPreview | null> {
  const row = await confirmationByToken(token);
  if (!row) return null;
  return previewFrom(row);
}

export async function decideCashLink(token: string, decision: "ACCEPTED" | "DECLINED") {
  const row = await confirmationByToken(token);
  if (!row) throw new AppError("This confirmation link is not valid.", 404);
  const view = previewFrom(row);
  if (view.status === "ACCEPTED") return view;
  if (view.status !== "PENDING") throw new AppError("This cash request is no longer open.");
  const paymentId = await pendingCashPayment(row.ride_id);
  if (!paymentId) throw new AppError("This cash payment is no longer waiting.");
  await applyCashDecision({ rideUuid: row.ride_id, paymentId, decision, requireConfirmation: true });
  return { ...view, status: decision };
}

export function driverMobile(phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}

export async function listDriverCash(mobile: string) {
  const db = createServiceClient();
  const driver = await db.from("drivers").select("id,name").eq("mobile", mobile).eq("is_active", true).maybeSingle();
  if (driver.error) {
    logServerError("driver-cash", driver.error);
    throw new AppError("Unable to load cash requests.", 500);
  }
  if (!driver.data) return null;
  const { data, error } = await db
    .from("cash_confirmations")
    .select(confirmationSelect)
    .eq("driver_id", driver.data.id)
    .eq("status", "PENDING")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) {
    logServerError("driver-cash", error);
    throw new AppError("Unable to load cash requests.", 500);
  }
  return {
    driverName: driver.data.name as string,
    requests: ((data ?? []) as unknown as ConfirmationRow[]).map((row) => ({ id: row.id, ...previewFrom(row) })),
  };
}

export async function decideDriverCash(mobile: string, confirmationId: string, decision: "ACCEPTED" | "DECLINED") {
  const db = createServiceClient();
  const driver = await db.from("drivers").select("id").eq("mobile", mobile).eq("is_active", true).maybeSingle();
  if (!driver.data) throw new AppError("This phone is not a ROVEYA driver.", 403);
  const row = await db.from("cash_confirmations").select("id,ride_id,driver_id,status,expires_at").eq("id", confirmationId).maybeSingle();
  if (row.error || !row.data || row.data.driver_id !== driver.data.id) throw new AppError("This cash request is not yours.", 404);
  if (row.data.status !== "PENDING" || new Date(row.data.expires_at).getTime() < Date.now()) {
    throw new AppError("This cash request is no longer open.");
  }
  const paymentId = await pendingCashPayment(row.data.ride_id);
  if (!paymentId) throw new AppError("This cash payment is no longer waiting.");
  await applyCashDecision({ rideUuid: row.data.ride_id, paymentId, decision, requireConfirmation: true });
}
