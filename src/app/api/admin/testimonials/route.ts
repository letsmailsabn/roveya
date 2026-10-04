import { requireStaff } from "@/lib/auth";
import { listTestimonials, setTestimonialPublished } from "@/lib/services/admin";
import { toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    await requireStaff();
    return Response.json(await listTestimonials());
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireStaff();
    const body = await request.json().catch(() => null);
    if (!body?.id) return jsonError("Missing id");
    const updated = await setTestimonialPublished(staff, String(body.id), Boolean(body.published));
    return Response.json(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}
