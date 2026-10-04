import { requireCeo, requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { updateSettings } from "@/lib/services/admin";
import { toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(8),
  whatsapp: z.string().min(8),
  email: z.string().email(),
  address: z.string().min(8),
  hours: z.string().min(4),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    await requireStaff();
    return Response.json(await getSettings());
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requireCeo();
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid");
    await updateSettings(staff, parsed.data);
    return Response.json(await getSettings());
  } catch (error) {
    return toErrorResponse(error);
  }
}
