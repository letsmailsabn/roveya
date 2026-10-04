import "server-only";
import { AppError, logServerError } from "@/lib/errors";
import { createServiceClient } from "@/lib/supabase/service";
import type { StaffSession } from "@/lib/auth";
import { isLocalAdminEnabled } from "@/lib/dev-mode";
import {
  devCreateDestination,
  devListCustomers,
  devListDestinations,
  devListMessages,
  devListRides,
  devListTestimonials,
  devSetTestimonialPublished,
  devUpdateDestination,
  devUpdateSettings,
} from "@/lib/dev-store";
import { slugify } from "@/lib/validation";

async function audit(staff: StaffSession, action: string, entity: string, entityId: string, oldData: unknown, newData: unknown) {
  const db = createServiceClient();
  const { error } = await db.from("audit_logs").insert({
    user_id: staff.id,
    action,
    entity,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
  });
  if (error) logServerError("audit", error);
}

export async function listRides() {
  if (isLocalAdminEnabled()) return devListRides();
  const db = createServiceClient();
  const { data, error } = await db
    .from("rides")
    .select(
      `
      id, ride_id, number_of_seats, total_amount, status, created_at,
      customers ( name, mobile ),
      destinations ( name ),
      payments ( method, status, created_at )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    logServerError("admin-rides", error);
    throw new AppError("Unable to load rides.", 500);
  }
  return (data ?? []).map((ride) => {
    const customer = Array.isArray(ride.customers) ? ride.customers[0] : ride.customers;
    const destination = Array.isArray(ride.destinations) ? ride.destinations[0] : ride.destinations;
    const payments = [...(ride.payments ?? [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const payment = payments[0];
    return {
      id: ride.id,
      publicId: ride.ride_id,
      customerName: customer?.name ?? "",
      mobile: customer?.mobile ?? "",
      destinationName: destination?.name ?? "",
      seats: ride.number_of_seats,
      totalFare: ride.total_amount,
      paymentMethod: payment?.method ?? null,
      paymentStatus: ride.status === "PAID" ? "PAID" : ride.status === "PAYMENT_FAILED" || ride.status === "CANCELLED" ? "FAILED" : "PENDING",
      rideStatus: ride.status,
    };
  });
}

export async function listDestinations() {
  if (isLocalAdminEnabled()) return devListDestinations();
  const db = createServiceClient();
  const { data, error } = await db.from("destinations").select("*").order("sort_order", { ascending: true });
  if (error) throw new AppError("Unable to load destinations.", 500);
  return (data ?? []).map(mapDestination);
}

function mapDestination(row: {
  id: string;
  name: string;
  fare_per_seat: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}) {
  return {
    id: row.id,
    name: row.name,
    farePerSeat: row.fare_per_seat,
    description: row.description ?? "",
    active: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function createDestination(
  staff: StaffSession,
  input: { name: string; farePerSeat: number; description: string; active: boolean; sortOrder: number },
) {
  if (isLocalAdminEnabled()) return devCreateDestination(input);
  const db = createServiceClient();
  const { data, error } = await db
    .from("destinations")
    .insert({
      name: input.name,
      slug: slugify(input.name),
      fare_per_seat: input.farePerSeat,
      description: input.description,
      is_active: input.active,
      sort_order: input.sortOrder,
    })
    .select("*")
    .single();
  if (error || !data) {
    logServerError("destination-create", error);
    throw new AppError("Unable to add the destination.", 500);
  }
  await audit(staff, "destination.created", "destinations", data.id, null, mapDestination(data));
  return mapDestination(data);
}

export async function updateDestination(
  staff: StaffSession,
  id: string,
  input: { name?: string; farePerSeat?: number; description?: string; active?: boolean },
) {
  if (isLocalAdminEnabled()) return devUpdateDestination(id, input);
  const db = createServiceClient();
  const current = await db.from("destinations").select("*").eq("id", id).maybeSingle();
  if (!current.data) throw new AppError("Destination not found", 404);
  const { data, error } = await db
    .from("destinations")
    .update({
      name: input.name ?? current.data.name,
      slug: input.name ? slugify(input.name) : current.data.slug,
      fare_per_seat: input.farePerSeat ?? current.data.fare_per_seat,
      description: input.description ?? current.data.description,
      is_active: input.active ?? current.data.is_active,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    logServerError("destination-update", error);
    throw new AppError("Unable to update the destination.", 500);
  }
  await audit(staff, "destination.updated", "destinations", id, mapDestination(current.data), mapDestination(data));
  return mapDestination(data);
}

export async function listCustomers() {
  if (isLocalAdminEnabled()) return devListCustomers();
  const db = createServiceClient();
  const { data, error } = await db.from("customer_summaries").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) {
    logServerError("customers", error);
    throw new AppError("Unable to load customers.", 500);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    totalRides: row.total_rides,
    totalSeats: row.total_seats,
    totalSpent: row.total_spent,
    averageRating: row.average_rating,
  }));
}

export async function listMessages() {
  if (isLocalAdminEnabled()) return devListMessages();
  const db = createServiceClient();
  const { data, error } = await db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw new AppError("Unable to load messages.", 500);
  return data ?? [];
}

export async function listTestimonials() {
  if (isLocalAdminEnabled()) return devListTestimonials();
  const db = createServiceClient();
  const { data, error } = await db.from("testimonials").select("*").order("created_at", { ascending: false });
  if (error) throw new AppError("Unable to load testimonials.", 500);
  return data ?? [];
}

export async function setTestimonialPublished(staff: StaffSession, id: string, published: boolean) {
  if (isLocalAdminEnabled()) return devSetTestimonialPublished(id, published);
  const db = createServiceClient();
  const current = await db.from("testimonials").select("id,published").eq("id", id).maybeSingle();
  if (!current.data) throw new AppError("Testimonial not found", 404);
  const { data, error } = await db.from("testimonials").update({ published }).eq("id", id).select("*").single();
  if (error || !data) throw new AppError("Unable to update the testimonial.", 500);
  await audit(staff, "testimonial.published", "testimonials", id, { published: current.data.published }, { published });
  return data;
}

export async function updateSettings(
  staff: StaffSession,
  input: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    hours: string;
    instagramUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string;
  },
) {
  if (isLocalAdminEnabled()) {
    return devUpdateSettings({
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      address: input.address,
      hours: input.hours,
      instagramUrl: input.instagramUrl || null,
      facebookUrl: input.facebookUrl || null,
      twitterUrl: input.twitterUrl || null,
    });
  }
  const db = createServiceClient();
  const current = await db.from("site_settings").select("*").eq("id", "roveya").maybeSingle();
  const next = {
    id: "roveya",
    phone: input.phone,
    whatsapp: input.whatsapp,
    email: input.email,
    address: input.address,
    hours: input.hours,
    instagram_url: input.instagramUrl || null,
    facebook_url: input.facebookUrl || null,
    twitter_url: input.twitterUrl || null,
  };
  const { error } = await db.from("site_settings").upsert(next);
  if (error) {
    logServerError("settings", error);
    throw new AppError("Unable to save settings.", 500);
  }
  await audit(staff, "settings.updated", "site_settings", "roveya", current.data, next);
  return next;
}
