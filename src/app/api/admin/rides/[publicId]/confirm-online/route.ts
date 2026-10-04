import { requireStaff } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";

export async function POST() {
  try {
    await requireStaff();
    return jsonError("Online payments are confirmed only by Razorpay.", 403);
  } catch (error) {
    return toErrorResponse(error);
  }
}
