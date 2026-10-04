import { NextRequest } from "next/server";
import { createRide } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { jsonError, fromZod } from "@/lib/http";
import { createRideSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "rides"), 12, 60_000);
  if (!limited.ok) return jsonError("Too many requests. Please wait a moment.", 429);

  try {
    const body = await request.json().catch(() => null);
    const parsed = createRideSchema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    const ride = await createRide(parsed.data);
    return Response.json(ride);
  } catch (error) {
    return toErrorResponse(error);
  }
}
