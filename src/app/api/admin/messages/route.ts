import { requireStaff } from "@/lib/auth";
import { listMessages } from "@/lib/services/admin";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireStaff();
    return Response.json(await listMessages());
  } catch (error) {
    return toErrorResponse(error);
  }
}
