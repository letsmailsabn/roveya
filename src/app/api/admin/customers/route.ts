import { requireStaff } from "@/lib/auth";
import { listCustomers } from "@/lib/services/admin";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    await requireStaff();
    return Response.json(await listCustomers());
  } catch (error) {
    return toErrorResponse(error);
  }
}
