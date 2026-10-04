import { autocompletePlaces, googleMapsKey } from "@/lib/google-places";
import { jsonError } from "@/lib/http";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    countrycode?: string;
    type?: string;
  };
};

type NearbyCache = { at: number; names: string[] };
const nearbyCache = new Map<string, NearbyCache>();

function photonLabel(props: NonNullable<PhotonFeature["properties"]>) {
  const name = props.name?.trim() ?? "";
  const city = props.city?.trim() ?? "";
  if (!name) return "";
  if (city && city.toLowerCase() !== name.toLowerCase()) return `${name}, ${city}`;
  return name;
}

async function nearbyNames(lat: number, lng: number, city: string) {
  const key = `v2:${lat.toFixed(1)},${lng.toFixed(1)}`;
  const cached = nearbyCache.get(key);
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached.names;
  const viewbox = `${lng - 0.45},${lat + 0.4},${lng + 0.45},${lat - 0.4}`;
  const groups: string[][] = [[], []];
  for (const [index, kind] of ["suburb", "town"].entries()) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=4&countrycodes=in&bounded=1&viewbox=${viewbox}&q=${kind}`,
        {
          headers: { Accept: "application/json", "User-Agent": "ROVEYA pool search" },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) continue;
      const rows = (await response.json()) as { name?: string }[];
      for (const row of rows) {
        const name = row.name?.trim() ?? "";
        if (!name || name.toLowerCase() === city.toLowerCase()) continue;
        const label = `${name}, ${city}`;
        if (!groups[index].some((item) => item.toLowerCase() === label.toLowerCase())) groups[index].push(label);
      }
    } catch {
      continue;
    }
  }
  const unique = [0, 1, 2].flatMap((index) => [groups[0][index], groups[1][index]].filter(Boolean));
  if (unique.length > 0) nearbyCache.set(key, { at: Date.now(), names: unique });
  return unique;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const session = url.searchParams.get("session")?.trim() ?? "";
  if (query.length < 2) return Response.json({ places: [] as { label: string; placeId: string }[] });

  if (googleMapsKey()) {
    try {
      const places = await autocompletePlaces(query, session);
      return Response.json({ places });
    } catch {
      return jsonError("Google Maps could not look up that place.", 502);
    }
  }

  const response = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en`,
    {
      headers: { Accept: "application/json", "User-Agent": "ROVEYA pool search" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) return jsonError("Place search is unavailable right now.", 502);

  const body = (await response.json()) as { features?: PhotonFeature[] };
  const places: { label: string; placeId: string }[] = [];
  let lat = Number.NaN;
  let lng = Number.NaN;
  let city = query;
  for (const feature of body.features ?? []) {
    const props = feature.properties;
    if (!props || props.countrycode !== "IN") continue;
    if (props.type === "house" || props.type === "street" || props.type === "other") continue;
    const label = photonLabel(props);
    if (label && !places.some((place) => place.label.toLowerCase() === label.toLowerCase())) places.push({ label, placeId: "" });
    const pair = feature.geometry?.coordinates;
    if (!Number.isFinite(lat) && pair && pair.length === 2) {
      lng = pair[0];
      lat = pair[1];
      city = props.city?.trim() || props.name?.trim() || query;
    }
  }
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const nearby = await nearbyNames(lat, lng, city);
    for (const name of nearby) {
      if (!places.some((place) => place.label.toLowerCase() === name.toLowerCase())) places.push({ label: name, placeId: "" });
    }
  }
  return Response.json({
    places: places.slice(0, 8),
    hint: places.length > 0 ? "" : "A bus stand or other landmark needs the Google Maps key.",
  });
}
