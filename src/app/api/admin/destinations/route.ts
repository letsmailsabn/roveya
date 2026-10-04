import { requireCeo, requireStaff } from "@/lib/auth";
import { createDestination, listDestinations } from "@/lib/services/admin";
import { toErrorResponse } from "@/lib/errors";
import { destinationSchema } from "@/lib/validation";
import { fromZod } from "@/lib/http";

export async function GET() {
  try {
    await requireStaff();
    return Response.json(await listDestinations());
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireCeo();
    const body = await request.json().catch(() => null);
    const parsed = destinationSchema.safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    const created = await createDestination(staff, {
      name: parsed.data.name,
      farePerSeat: parsed.data.farePerSeat,
      description: parsed.data.description,
      active: parsed.data.active,
      sortOrder: parsed.data.sortOrder,
    });
    return Response.json(created);
  } catch (error) {
    return toErrorResponse(error);
  }
}
