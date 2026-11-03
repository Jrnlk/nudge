import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Next 16 calls this "proxy" (it was "middleware" before). Runs before every matched request. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static files and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|html)$).*)",
  ],
};
