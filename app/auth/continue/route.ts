import { NextResponse, type NextRequest } from "next/server";
import { destinationFor } from "@/lib/routing";
import { createClient } from "@/lib/supabase/server";

/** After an in-page sign-in, send the person to onboarding, Today, or Career. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const dest = data.user ? await destinationFor(supabase, data.user.id) : "/login";
  return NextResponse.redirect(new URL(dest, request.url));
}
