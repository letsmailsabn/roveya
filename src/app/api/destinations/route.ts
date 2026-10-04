import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/service";
import { AppError, logServerError, toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) return jsonError("Destinations are not available yet.", 503);
    const db = createServiceClient();
    const { data, error } = await db
      .from("destinations")
      .select("id,name,slug,description,fare_per_seat")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      logServerError("destinations", error);
      throw new AppError("Unable to load destinations.", 500);
    }
    return Response.json(
      (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        farePerSeat: row.fare_per_seat,
      })),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
