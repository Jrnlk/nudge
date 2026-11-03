import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinationFor, safeNext } from "@/lib/routing";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * Email links (confirm sign-up, reset password) land here with ?token_hash=...&type=...
 * This works even if the link is opened in a different browser than the one
 * that requested it. See SETUP.md for the email template change.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type || !TYPES.includes(type)) {
    return NextResponse.redirect(`${origin}/login?notice=link_expired`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?notice=link_expired`);
  }

  if (type === "recovery") return NextResponse.redirect(`${origin}/auth/reset-password`);

  const next = searchParams.get("next");
  const dest = next ? safeNext(next) : await destinationFor(supabase, data.user.id);
  return NextResponse.redirect(`${origin}${dest}`);
}
