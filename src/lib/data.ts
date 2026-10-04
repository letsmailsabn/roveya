import "server-only";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";
import { isLocalAdminEnabled } from "@/lib/dev-mode";
import { devActiveDestinations, devGetSettings, devPublishedTestimonials } from "@/lib/dev-store";

export type SiteSetting = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
};

export type PublicDestination = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  farePerSeat: number;
};

export type PublicTestimonial = {
  id: string;
  name: string;
  route: string | null;
  rating: number;
  quote: string;
};

const fallbackSettings: SiteSetting = {
  phone: "+91 90000 00000",
  whatsapp: "919000000000",
  email: "hello@roveya.com",
  address: "ROVEYA Travel Desk, Khammam, Telangana, India",
  hours: "Daily, 5:00 AM – 11:00 PM",
  instagramUrl: null,
  facebookUrl: null,
  twitterUrl: null,
};

function mapSettings(row: {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
}): SiteSetting {
  return {
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    hours: row.hours,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    twitterUrl: row.twitter_url,
  };
}

export async function getSettings(): Promise<SiteSetting> {
  if (isLocalAdminEnabled()) return devGetSettings();
  if (!isSupabaseConfigured()) return fallbackSettings;
  const db = createServiceClient();
  const { data } = await db.from("site_settings").select("*").eq("id", "roveya").maybeSingle();
  if (!data) return fallbackSettings;
  return mapSettings(data);
}

export async function getActiveDestinations(): Promise<PublicDestination[]> {
  if (isLocalAdminEnabled()) return devActiveDestinations();
  if (!isSupabaseConfigured()) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("destinations")
    .select("id,name,slug,description,fare_per_seat")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    farePerSeat: row.fare_per_seat,
  }));
}

export async function getPublishedTestimonials(): Promise<PublicTestimonial[]> {
  if (isLocalAdminEnabled()) return devPublishedTestimonials();
  if (!isSupabaseConfigured()) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("testimonials")
    .select("id,name,route,rating,quote")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

export type TravelRoute = {
  id: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  farePerSeat: number;
  seatsTotal: number;
  notes: string | null;
};

export async function getTravelRoutes(): Promise<TravelRoute[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("travel_routes")
    .select("id,origin,destination,depart_at,arrive_at,fare_per_seat,seats_total,notes")
    .eq("is_active", true)
    .gte("depart_at", new Date().toISOString())
    .order("depart_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapRoute);
}

export async function getTravelRoute(id: string): Promise<TravelRoute | null> {
  if (!isSupabaseConfigured()) return null;
  const db = createServiceClient();
  const { data, error } = await db
    .from("travel_routes")
    .select("id,origin,destination,depart_at,arrive_at,fare_per_seat,seats_total,notes")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return mapRoute(data);
}

function mapRoute(row: {
  id: string;
  origin: string;
  destination: string;
  depart_at: string;
  arrive_at: string;
  fare_per_seat: number;
  seats_total: number;
  notes: string | null;
}): TravelRoute {
  return {
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    departAt: row.depart_at,
    arriveAt: row.arrive_at,
    farePerSeat: row.fare_per_seat,
    seatsTotal: row.seats_total,
    notes: row.notes,
  };
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
