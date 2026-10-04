import { NextRequest, NextResponse } from "next/server";
import { updateStaffSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return updateStaffSession(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
