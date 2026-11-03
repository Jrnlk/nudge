import { NextResponse, type NextRequest } from "next/server";
import { noticeForOAuthError } from "@/lib/auth-messages";
import { destinationFor, safeNext } from "@/lib/routing";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (Google, Microsoft) and PKCE email links land here with ?code=...
 * We exchange the code for a session cookie, fill in the first name if we
 * don't have one yet, then send the person where they belong.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const provider = searchParams.get("provider");
  const next = searchParams.get("next");

  const toLogin = (notice: string) => NextResponse.redirect(`${origin}/login?notice=${notice}`);

  // The provider (or the person) cancelled, or an admin approval screen was left.
  const error = searchParams.get("error") ?? searchParams.get("error_code");
  if (error || !code) {
    if (!code && !error) return toLogin("oauth_failed");
    return toLogin(noticeForOAuthError(provider, error, searchParams.get("error_description")));
  }

  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !data.user) {
    // Most often an email link opened in a different browser, or used twice.
    return toLogin(provider ? "oauth_failed" : "link_expired");
  }

  const user = data.user;

  // Save the provider's name to profiles.first_name, but only if it's empty.
  const meta = user.user_metadata ?? {};
  const providerName: string =
    meta.given_name || meta.first_name || meta.full_name || meta.name || "";
  const firstName = providerName.trim().split(/\s+/)[0]?.slice(0, 80);
  if (firstName) {
    await supabase
      .from("profiles")
      .update({ first_name: firstName })
      .eq("id", user.id)
      .is("first_name", null);
  }

  const dest = next ? safeNext(next) : await destinationFor(supabase, user.id);
  return NextResponse.redirect(`${origin}${dest}`);
}
