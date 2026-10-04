import { requireStaff } from "@/lib/auth";
import { listRides } from "@/lib/services/admin";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireStaff();
    return Response.json(await listRides());
  } catch (error) {
    return toErrorResponse(error);
  }
}
