export type MapPoint = { lat: number; lng: number };

const cache = new Map<string, MapPoint | null>();

export function haversineKm(a: MapPoint, b: MapPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toLocal(point: MapPoint, origin: MapPoint) {
  const lat = (point.lat * Math.PI) / 180;
  const lng = (point.lng * Math.PI) / 180;
  const lat0 = (origin.lat * Math.PI) / 180;
  const lng0 = (origin.lng * Math.PI) / 180;
  return {
    x: (lng - lng0) * Math.cos(lat0) * 6371,
    y: (lat - lat0) * 6371,
  };
}

export function distanceToSegmentKm(point: MapPoint, start: MapPoint, end: MapPoint) {
  const here = toLocal(point, start);
  const finish = toLocal(end, start);
  const length = finish.x * finish.x + finish.y * finish.y;
  const progress = length === 0 ? 0 : Math.max(0, Math.min(1, (here.x * finish.x + here.y * finish.y) / length));
  const dx = here.x - progress * finish.x;
  const dy = here.y - progress * finish.y;
  return { km: Math.hypot(dx, dy), progress };
}

export function tripFitsSearch(from: MapPoint, to: MapPoint, origin: MapPoint, destination: MapPoint) {
  const originKm = haversineKm(from, origin);
  const destinationKm = haversineKm(to, destination);
  if (originKm > 45) return false;
  if (destinationKm <= 45) return true;
  const span = haversineKm(from, to);
  const traveled = haversineKm(from, destination);
  const line = distanceToSegmentKm(destination, from, to);
  return traveled > 15 && line.progress > 0.12 && line.progress < 0.9 && line.km < 40 && traveled < span;
}

export async function geocodePlace(name: string): Promise<MapPoint | null> {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (process.env.GOOGLE_MAPS_API_KEY?.trim()) {
    const { geocodeAddress } = await import("@/lib/google-places");
    return geocodeAddress(name);
  }
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(name)}`,
      {
        headers: { Accept: "application/json", "User-Agent": "ROVEYA pool search" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) {
      cache.set(key, null);
      return null;
    }
    const rows = (await response.json()) as { lat?: string; lon?: string }[];
    const lat = Number(rows[0]?.lat);
    const lng = Number(rows[0]?.lon);
    const point = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    cache.set(key, point);
    return point;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export async function geocodePlaces(names: string[]) {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const points = await Promise.all(unique.map(async (name) => [name.toLowerCase(), await geocodePlace(name)] as const));
  return new Map(points);
}
