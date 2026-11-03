"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { baseDate, cleanAnswers, cleanRows } from "@/lib/onboarding";

type Result = { error: string } | undefined;

const SAVE_FAILED = "We couldn't save that just now. Your answers are still here, so try again in a moment.";

/** Called whenever the person leaves a step (Continue, Back, or swipe). `step` is where they are going (1-3). */
export async function saveProgress(answers: unknown, step: number): Promise<Result> {
  const { supabase, user } = await requireUser();
  const onboarding_step = Math.min(3, Math.max(1, Math.round(Number(step) || 1)));
  const { error } = await supabase
    .from("profiles")
    .update({ ...cleanAnswers(answers), onboarding_step })
    .eq("id", user.id);
  if (error) return { error: SAVE_FAILED };
}

/** "Skip setup": keep what's filled in, mark onboarding done, go to the app. Draft jobs are not added. */
export async function skipSetup(answers: unknown): Promise<Result> {
  const { supabase, user } = await requireUser();
  const profile = cleanAnswers(answers);
  const { error } = await supabase
    .from("profiles")
    .update({ ...profile, onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: SAVE_FAILED };

  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  redirect(profile.situation === "settled" && !count ? "/career" : "/today");
}

/** "Add N applications" / "Skip for now" on step 3. The only place onboarding writes to applications. */
export async function finishOnboarding(answers: unknown, rows: unknown, clientToday: unknown): Promise<Result> {
  const { supabase, user } = await requireUser();
  const profile = cleanAnswers(answers);
  const apps = cleanRows(rows, baseDate(clientToday)).map((a) => ({ ...a, user_id: user.id }));

  if (apps.length) {
    const { error } = await supabase.from("applications").insert(apps);
    if (error) return { error: "We couldn't add those jobs just now. Nothing was lost, so try again in a moment." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ...profile, onboarding_step: 3, onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: SAVE_FAILED };

  redirect(profile.situation === "settled" && apps.length === 0 ? "/career" : "/today");
}
