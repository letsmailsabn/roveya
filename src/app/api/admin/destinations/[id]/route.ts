import { requireCeo } from "@/lib/auth";
import { updateDestination } from "@/lib/services/admin";
import { toErrorResponse } from "@/lib/errors";
import { destinationSchema } from "@/lib/validation";
import { fromZod } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireCeo();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = destinationSchema.partial().safeParse(body);
    if (!parsed.success) return fromZod(parsed.error);
    const updated = await updateDestination(staff, id, {
      name: parsed.data.name,
      farePerSeat: parsed.data.farePerSeat,
      description: parsed.data.description,
      active: parsed.data.active,
    });
    return Response.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}
