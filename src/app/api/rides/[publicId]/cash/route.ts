import { confirmCashByCustomer } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  const limited = rateLimit(clientKey(request, "cash-slide"), 8, 60_000);
  if (!limited.ok) return jsonError("Too many requests", 429);

  try {
    const { publicId } = await context.params;
    return Response.json(await confirmCashByCustomer(publicId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
