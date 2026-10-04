import { requireStaff } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requireStaff();
    return Response.json({ name: session.name, email: session.email, role: session.role });
  } catch (error) {
    return toErrorResponse(error);
  }
}
