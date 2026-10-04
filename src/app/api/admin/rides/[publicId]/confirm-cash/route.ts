import { requireStaff } from "@/lib/auth";
import { confirmCashPayment } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";

export async function POST(_request: Request, context: { params: Promise<{ publicId: string }> }) {
  try {
    const staff = await requireStaff();
    const { publicId } = await context.params;
    await confirmCashPayment(publicId, staff);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
