import type { MapPoint } from "@/lib/geo";

export type PlaceSuggestion = { label: string; placeId: string };

const pointCache = new Map<string, MapPoint | null>();

export function googleMapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

export async function autocompletePlaces(input: string, sessionToken: string): Promise<PlaceSuggestion[]> {
  const key = googleMapsKey();
  if (!key) return [];
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["in"],
      languageCode: "en",
      sessionToken,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const body = (await response.json()) as {
    suggestions?: { placePrediction?: { placeId?: string; text?: { text?: string } } }[];
  };
  const places: PlaceSuggestion[] = [];
  for (const suggestion of body.suggestions ?? []) {
    const label = suggestion.placePrediction?.text?.text?.trim() ?? "";
    const placeId = suggestion.placePrediction?.placeId?.trim() ?? "";
    if (!label || !placeId) continue;
    if (places.some((place) => place.label.toLowerCase() === label.toLowerCase())) continue;
    places.push({ label, placeId });
  }
  return places.slice(0, 8);
}

export async function placePoint(placeId: string, sessionToken: string): Promise<{ label: string; point: MapPoint } | null> {
  const key = googleMapsKey();
  const id = placeId.replace(/^places\//, "");
  if (!key || !/^[\w-]+$/.test(id)) return null;
  const url = new URL(`https://places.googleapis.com/v1/places/${id}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "location,formattedAddress,displayName",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    formattedAddress?: string;
    displayName?: { text?: string };
    location?: { latitude?: number; longitude?: number };
  };
  const lat = Number(body.location?.latitude);
  const lng = Number(body.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: body.formattedAddress || body.displayName?.text || "", point: { lat, lng } };
}

export async function geocodeAddress(name: string): Promise<MapPoint | null> {
  const key = googleMapsKey();
  const query = name.trim().toLowerCase();
  if (!key || !query) return null;
  if (pointCache.has(query)) return pointCache.get(query) ?? null;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", name);
  url.searchParams.set("components", "country:IN");
  url.searchParams.set("region", "in");
  url.searchParams.set("key", key);
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      status?: string;
      results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
    };
    const lat = Number(body.results?.[0]?.geometry?.location?.lat);
    const lng = Number(body.results?.[0]?.geometry?.location?.lng);
    const point = body.status === "OK" && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    if (body.status === "OK" || body.status === "ZERO_RESULTS") pointCache.set(query, point);
    return point;
  } catch {
    return null;
  }
}

export function googleMapEmbed(from: MapPoint, to: MapPoint) {
  const key = googleMapsKey();
  if (!key) return "";
  const url = new URL("https://www.google.com/maps/embed/v1/directions");
  url.searchParams.set("key", key);
  url.searchParams.set("origin", `${from.lat},${from.lng}`);
  url.searchParams.set("destination", `${to.lat},${to.lng}`);
  url.searchParams.set("mode", "driving");
  return url.toString();
}
