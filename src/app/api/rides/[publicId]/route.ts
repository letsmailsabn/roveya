import { getRide } from "@/lib/services/payments";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_request: Request, context: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await context.params;
    return Response.json(await getRide(publicId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
