import { searchPoolTrips } from "@/lib/data";
import type { MapPoint } from "@/lib/geo";
import { googleMapEmbed } from "@/lib/google-places";
import { jsonError } from "@/lib/http";

function readPoint(url: URL, latKey: string, lngKey: string): MapPoint | null {
  const lat = Number(url.searchParams.get(latKey));
  const lng = Number(url.searchParams.get(lngKey));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.trim() ?? "";
  const to = url.searchParams.get("to")?.trim() ?? "";
  const date = url.searchParams.get("date")?.trim() ?? "";
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonError("Choose a starting city, a destination, and a departure date.");
  }
  if (from.toLowerCase() === to.toLowerCase()) {
    return jsonError("The starting city and the destination need to be different.");
  }
  const trips = await searchPoolTrips(from, to, date, {
    fromPoint: readPoint(url, "fromLat", "fromLng"),
    toPoint: readPoint(url, "toLat", "toLng"),
  });
  return Response.json({ ...trips, mapUrl: trips.fromPoint && trips.toPoint ? googleMapEmbed(trips.fromPoint, trips.toPoint) : "" });
}
