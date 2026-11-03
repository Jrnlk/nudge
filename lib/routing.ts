import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

/**
 * Where a signed-in person belongs:
 *  - onboarding not finished -> /onboarding (it resumes at the saved step)
 *  - "Settled in a job" with no applications -> /career
 *  - everyone else -> /today
 */
export async function destinationFor(supabase: Client, userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, situation")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) return "/onboarding";

  if (profile.situation === "settled") {
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (!count) return "/career";
  }
  return "/today";
}

/** Only allow same-site relative paths in ?next= to avoid open redirects. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
