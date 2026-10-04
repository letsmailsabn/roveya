import { jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { seatsLeftOn } from "@/lib/data";
import { createStaffClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "pool-book"), 8, 60_000);
  if (!limited.ok) return jsonError("Too many requests. Please wait a moment.", 429);

  const body = (await request.json().catch(() => null)) as { routeId?: string; seats?: number } | null;
  const routeId = body?.routeId?.trim() ?? "";
  const seats = Number(body?.seats);
  if (!routeId || !Number.isInteger(seats) || seats < 1 || seats > 4) {
    return jsonError("Choose a trip and between 1 and 4 passengers.");
  }

  const auth = await createStaffClient();
  const { data: session } = await auth.auth.getUser();
  const user = session.user;
  if (!user) return jsonError("Sign in with Google before booking.", 401);

  const meta = user.user_metadata ?? {};
  const name = String(meta.full_name || meta.name || "").trim() || "Traveller";
  const mobileRaw = String(user.phone ?? meta.mobile ?? "").replace(/\D/g, "").slice(-10);
  const mobile = /^[6-9][0-9]{9}$/.test(mobileRaw) ? mobileRaw : null;

  const db = createServiceClient();
  const open = await seatsLeftOn(routeId);
  if (open === null) return jsonError("That taxi is no longer open for booking.", 404);
  if (seats > open) return jsonError(open === 0 ? "No seats left on this taxi." : `Only ${open} seat${open === 1 ? "" : "s"} left on this taxi.`, 409);

  const route = await db
    .from("travel_routes")
    .select("id")
    .eq("id", routeId)
    .eq("is_active", true)
    .gte("depart_at", new Date().toISOString())
    .maybeSingle();
  if (!route.data) return jsonError("That taxi is no longer open for booking.", 404);

  const existing = await db.from("customer_profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  let customerId = existing.data?.id as string | undefined;
  if (!customerId) {
    const created = await db
      .from("customer_profiles")
      .insert({ auth_user_id: user.id, name, mobile, email: user.email })
      .select("id")
      .single();
    if (created.error || !created.data) {
      return jsonError("Your passenger profile could not be saved. Try again in a moment.", 400);
    }
    customerId = created.data.id;
  }

  const booked = await db.from("pool_bookings").insert({
    route_id: routeId,
    customer_id: customerId,
    seats,
    status: "REQUESTED",
  });
  if (booked.error) {
    if (booked.error.code === "23505") return jsonError("You already booked this taxi.", 409);
    if (booked.error.message.toLowerCase().includes("not enough seats")) {
      return jsonError("Not enough seats left on this taxi.", 409);
    }
    return jsonError("The desk could not take this booking. Try again.", 400);
  }

  const seatsLeft = await seatsLeftOn(routeId);
  return Response.json({ ok: true, seatsLeft: seatsLeft ?? 0 });
}
