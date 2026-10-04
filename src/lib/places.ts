type Geo = {
  name: string;
  city: string;
  kind: string;
  lat: number;
  lon: number;
  south: number;
  north: number;
  west: number;
  east: number;
};

export type PlaceChoice = { name: string; detail: string };

type NominatimRow = {
  lat?: string;
  lon?: string;
  type?: string;
  name?: string;
  display_name?: string;
  boundingbox?: [string, string, string, string];
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
  };
};

const located = new Map<string, Geo | null>();
const areas = new Map<string, string[]>();
let lastLookup = 0;
let queue: Promise<unknown> = Promise.resolve();

function norm(value: string) {
  return value.toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function placeMatches(city: string, query: string) {
  const left = norm(city);
  const right = norm(query);
  if (!left || !right) return false;
  return left === right || right.startsWith(left) || left.startsWith(right) || right.includes(left);
}

function pace<T>(task: () => Promise<T>) {
  const run = queue.then(async () => {
    const wait = 1100 - (Date.now() - lastLookup);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastLookup = Date.now();
    return task();
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function nominatim(query: string) {
  const response = await pace(() =>
    fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json", "User-Agent": "ROVEYA pool search" }, cache: "no-store" },
    ),
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as NominatimRow[];
  return rows[0] ?? null;
}

async function locate(query: string): Promise<Geo | null> {
  const key = norm(query);
  if (!key) return null;
  if (located.has(key)) return located.get(key) ?? null;
  const row = await nominatim(query);
  if (!row?.lat || !row.lon || !row.boundingbox) {
    located.set(key, null);
    return null;
  }
  const [south, north, west, east] = row.boundingbox.map(Number);
  const geo: Geo = {
    name: row.name || row.display_name?.split(",")[0] || query,
    city: row.address?.city || row.address?.town || row.address?.village || "",
    kind: row.type || "",
    lat: Number(row.lat),
    lon: Number(row.lon),
    south,
    north,
    west,
    east,
  };
  located.set(key, geo);
  located.set(norm(geo.name), geo);
  return geo;
}

function inside(area: Geo, point: Geo) {
  const height = area.north - area.south;
  const width = area.east - area.west;
  if (height <= 0 || width <= 0 || height > 1.2 || width > 1.2) return false;
  return point.lat >= area.south && point.lat <= area.north && point.lon >= area.west && point.lon <= area.east;
}

function namedTogether(left: Geo, right: Geo) {
  const names = [left.name, left.city].map(norm).filter(Boolean);
  const other = [right.name, right.city].map(norm).filter(Boolean);
  return names.some((name) => other.includes(name));
}

export async function sameArea(place: string, query: string) {
  if (placeMatches(place, query)) return true;
  const [left, right] = await Promise.all([locate(place), locate(query)]);
  if (!left || !right) return false;
  return namedTogether(left, right) || inside(left, right) || inside(right, left);
}

async function localities(city: Geo) {
  const key = `${norm(city.name)}:${city.south.toFixed(2)}:${city.west.toFixed(2)}`;
  const saved = areas.get(key);
  if (saved) return saved;
  const query = `[out:json][timeout:12];node["place"~"suburb|neighbourhood|locality|quarter|town|city"](${city.south},${city.west},${city.north},${city.east});out tags 40;`;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ROVEYA pool search" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { elements?: { tags?: { name?: string } }[] };
    const names = [...new Set((payload.elements ?? []).map((item) => item.tags?.name?.trim() || "").filter(Boolean))]
      .filter((name) => norm(name) !== norm(city.name))
      .sort((a, b) => a.localeCompare(b));
    areas.set(key, names);
    return names;
  } catch {
    return [];
  }
}

export async function suggestPlaces(query: string): Promise<PlaceChoice[]> {
  const geo = await locate(query);
  if (!geo) return [];
  const typed = norm(query);
  const cityName = geo.city || geo.name;
  const isCity = geo.kind === "city" || geo.kind === "town" || geo.kind === "administrative";
  if (isCity && (norm(geo.name).startsWith(typed) || typed.startsWith(norm(geo.name)))) {
    const extra = typed.startsWith(norm(geo.name)) ? typed.slice(norm(geo.name).length).trim() : "";
    const insideCity = (await localities(geo)).filter((name) => !extra || norm(name).includes(extra));
    return [{ name: geo.name, detail: geo.city && norm(geo.city) !== norm(geo.name) ? geo.city : "" }, ...insideCity.slice(0, 24).map((name) => ({ name, detail: geo.name }))];
  }
  return [{ name: geo.name, detail: geo.city && norm(geo.city) !== norm(geo.name) ? geo.city : "" }];
}
