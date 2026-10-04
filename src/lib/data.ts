import "server-only";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";
import { isLocalAdminEnabled } from "@/lib/dev-mode";
import { devActiveDestinations, devGetSettings, devPublishedTestimonials } from "@/lib/dev-store";
import { geocodePlaces, haversineKm, tripFitsSearch, type MapPoint } from "@/lib/geo";
import type { SearchTrip, TravelRoute } from "@/lib/pool";
import { kolkataDay } from "@/lib/time";

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

export type { PoolDriver, TravelRoute } from "@/lib/pool";

export async function getActiveDrivers() {
  if (!isSupabaseConfigured()) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("drivers")
    .select("id,name,vehicle_number,vehicle_name")
    .eq("is_active", true)
    .order("name");
  if (error || !data) return [];
  return data.map((driver) => ({
    id: String(driver.id),
    name: String(driver.name),
    vehicleNumber: String(driver.vehicle_number),
    vehicleName: driver.vehicle_name ? String(driver.vehicle_name) : "",
  }));
}

export async function getPoolCatalog(): Promise<{ origin: string; destination: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createServiceClient();
  const { data, error } = await db.from("travel_routes").select("origin,destination").eq("is_active", true);
  if (error || !data) return [];
  const seen = new Set<string>();
  const list: { origin: string; destination: string }[] = [];
  for (const row of data) {
    const origin = String(row.origin);
    const destination = String(row.destination);
    const key = `${origin.toLowerCase()}→${destination.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({ origin, destination });
  }
  return list;
}

export async function getTravelRoutes(): Promise<TravelRoute[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("travel_routes")
    .select("id,origin,destination,depart_at,arrive_at,fare_per_seat,seats_total,notes,driver_id")
    .eq("is_active", true)
    .gte("depart_at", new Date().toISOString())
    .order("depart_at", { ascending: true });
  if (error || !data) return [];

  const [driverRes, bookingRes, photoRes, ratingRes] = await Promise.all([
    db.from("drivers").select("id,name,vehicle_name,vehicle_number"),
    db.from("pool_bookings").select("route_id,seats").in("status", ["REQUESTED", "CONFIRMED"]),
    db.from("drivers").select("id,photo_url"),
    db.from("ratings").select("driver_id,stars"),
  ]);

  const drivers = new Map((driverRes.data ?? []).map((driver) => [driver.id as string, driver]));
  const photos = photoRes.error
    ? new Map<string, string | null>()
    : new Map((photoRes.data ?? []).map((driver) => [driver.id as string, (driver.photo_url as string | null) ?? null]));
  const ratings = new Map<string, { average: number; count: number }>();
  if (!ratingRes.error) {
    const buckets = new Map<string, number[]>();
    for (const row of ratingRes.data ?? []) {
      const driverId = row.driver_id as string | null;
      if (!driverId) continue;
      const stars = buckets.get(driverId) ?? [];
      stars.push(Number(row.stars));
      buckets.set(driverId, stars);
    }
    for (const [driverId, stars] of buckets) {
      const total = stars.reduce((sum, value) => sum + value, 0);
      ratings.set(driverId, { average: total / stars.length, count: stars.length });
    }
  }
  const taken = new Map<string, number>();
  for (const booking of bookingRes.data ?? []) {
    const routeId = booking.route_id as string;
    taken.set(routeId, (taken.get(routeId) ?? 0) + Number(booking.seats));
  }

  return data.map((row) =>
    mapRoute(
      row,
      drivers.get(row.driver_id as string) ?? null,
      photos,
      ratings.get(row.driver_id as string) ?? null,
      taken.get(row.id as string) ?? 0,
    ),
  );
}

export async function searchPoolTrips(
  from: string,
  to: string,
  date: string,
  chosen?: { fromPoint?: MapPoint | null; toPoint?: MapPoint | null },
): Promise<{
  trips: SearchTrip[];
  fromPoint: MapPoint | null;
  toPoint: MapPoint | null;
}> {
  const routes = (await getTravelRoutes()).filter((route) => kolkataDay(route.departAt) === date);
  const points = await geocodePlaces([from, to, ...routes.flatMap((route) => [route.origin, route.destination])]);
  const fromPoint = chosen?.fromPoint ?? points.get(from.trim().toLowerCase()) ?? null;
  const toPoint = chosen?.toPoint ?? points.get(to.trim().toLowerCase()) ?? null;
  const trips = routes.flatMap((route) => {
    const exact = placeMatches(route.origin, from) && placeMatches(route.destination, to);
    const origin = points.get(route.origin.trim().toLowerCase()) ?? null;
    const destination = points.get(route.destination.trim().toLowerCase()) ?? null;
    const originKm = fromPoint && origin ? Math.round(haversineKm(fromPoint, origin)) : null;
    const destinationKm = toPoint && destination ? Math.round(haversineKm(toPoint, destination)) : null;
    const along = Boolean(fromPoint && toPoint && origin && destination && tripFitsSearch(fromPoint, toPoint, origin, destination));
    if (!exact && !along) return [];
    const rideMinutes = Math.max(Math.round((new Date(route.arriveAt).getTime() - new Date(route.departAt).getTime()) / 60000), 0);
    return [{ ...route, originKm, destinationKm, rideMinutes }];
  });
  trips.sort((a, b) => a.departAt.localeCompare(b.departAt) || a.farePerSeat - b.farePerSeat);
  return { trips, fromPoint, toPoint };
}

function placeMatches(city: string, query: string) {
  const left = city.trim().toLowerCase();
  const right = query.trim().toLowerCase();
  if (!left || !right) return false;
  return left === right || right.startsWith(left) || left.startsWith(right) || right.includes(left);
}

export async function seatsLeftOn(routeId: string): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;
  const db = createServiceClient();
  const [route, bookings] = await Promise.all([
    db.from("travel_routes").select("seats_total").eq("id", routeId).maybeSingle(),
    db.from("pool_bookings").select("seats").eq("route_id", routeId).in("status", ["REQUESTED", "CONFIRMED"]),
  ]);
  if (!route.data) return null;
  const used = (bookings.data ?? []).reduce((sum, row) => sum + Number(row.seats), 0);
  return Math.max(Number(route.data.seats_total) - used, 0);
}

export async function getTravelRoute(id: string): Promise<TravelRoute | null> {
  if (!isSupabaseConfigured()) return null;
  const db = createServiceClient();
  const { data, error } = await db
    .from("travel_routes")
    .select("id,origin,destination,depart_at,arrive_at,fare_per_seat,seats_total,notes,driver_id")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  const routes = await getTravelRoutes();
  return routes.find((route) => route.id === data.id) ?? null;
}

function mapRoute(
  row: {
    id: string;
    origin: string;
    destination: string;
    depart_at: string;
    arrive_at: string;
    fare_per_seat: number;
    seats_total: number;
    notes: string | null;
    driver_id: string | null;
  },
  driver: { id: string; name: string; vehicle_name: string | null; vehicle_number: string } | null,
  photos: Map<string, string | null>,
  rating: { average: number; count: number } | null,
  taken: number,
): TravelRoute {
  const seatsTotal = Number(row.seats_total);
  return {
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    departAt: row.depart_at,
    arriveAt: row.arrive_at,
    farePerSeat: row.fare_per_seat,
    seatsTotal,
    seatsLeft: Math.max(seatsTotal - taken, 0),
    notes: row.notes,
    driver: driver
      ? {
          id: driver.id,
          name: driver.name,
          vehicleName: driver.vehicle_name,
          vehicleNumber: driver.vehicle_number,
          photoUrl: photos.get(driver.id) ?? null,
          ratingAverage: rating?.average ?? null,
          ratingCount: rating?.count ?? 0,
        }
      : null,
  };
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
