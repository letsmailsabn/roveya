import { NextRequest } from "next/server";
import { decideCashLink } from "@/lib/services/cash";
import { toErrorResponse } from "@/lib/errors";
import { jsonError } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const limited = rateLimit(clientKey(request, "cash-accept"), 12, 60_000);
  if (!limited.ok) return jsonError("Too many requests. Please wait a moment.", 429);
  try {
    const { token } = await context.params;
    const body = (await request.json().catch(() => null)) as { decision?: string } | null;
    const decision = body?.decision === "decline" ? "DECLINED" : body?.decision === "accept" ? "ACCEPTED" : null;
    if (!decision) return jsonError("Choose accept or decline.", 400);
    return Response.json(await decideCashLink(token, decision));
  } catch (error) {
    return toErrorResponse(error);
  }
}
