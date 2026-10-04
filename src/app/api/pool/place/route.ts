import { googleMapsKey, placePoint } from "@/lib/google-places";
import { jsonError } from "@/lib/http";

export async function GET(request: Request) {
  if (!googleMapsKey()) return jsonError("The Google Maps key is not set yet.", 503);
  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId")?.trim() ?? "";
  const session = url.searchParams.get("session")?.trim() ?? "";
  if (!placeId) return jsonError("Choose a place from the list.");
  const place = await placePoint(placeId, session);
  if (!place) return jsonError("That place could not be pinned on the map.", 404);
  return Response.json({ label: place.label, lat: place.point.lat, lng: place.point.lng });
}
