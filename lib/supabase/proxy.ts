import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/** Signed-in screens. Signed-out visitors are sent to /login. */
const PROTECTED = ["/onboarding", "/today", "/career", "/search", "/people", "/ask"];

const isProtected = (path: string) => PROTECTED.some((p) => path === p || path.startsWith(p + "/"));

/**
 * Refreshes the Supabase session cookie on every request and keeps signed-out
 * visitors away from signed-in screens. Onboarding vs. app routing needs the
 * profile row, so it happens in the server layouts (see lib/routing.ts).
 */
export async function updateSession(request: NextRequest) {
  // If redirect_to isn't on Supabase's Redirect URLs allow-list, Supabase falls back
  // to the Site URL and sends the person to /?code=... instead of /auth/callback.
  // Finish the sign-in there rather than showing the landing page.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("error"))) {
    const to = request.nextUrl.clone();
    to.pathname = "/auth/callback";
    return NextResponse.redirect(to);
  }

  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not put code between createServerClient and getClaims(): it refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;

  if (!signedIn && isProtected(request.nextUrl.pathname)) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = "";
    const redirect = NextResponse.redirect(to);
    // Carry over any refreshed/cleared auth cookies.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
