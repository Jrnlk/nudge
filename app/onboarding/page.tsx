import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { requireUser } from "@/lib/auth";
import { answersFromProfile } from "@/lib/onboarding";
import { destinationFor } from "@/lib/routing";

export const metadata: Metadata = { title: "Set up · Nudge" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // The sign-up trigger normally creates this row; recover if it didn't.
  if (!profile) {
    const inserted = await supabase.from("profiles").insert({ id: user.id }).select("*").single();
    profile = inserted.data;
  }
  if (!profile) throw new Error("Could not load your profile.");

  if (profile.onboarding_completed_at) redirect(await destinationFor(supabase, user.id));

  return (
    <OnboardingFlow
      initialAnswers={answersFromProfile(profile)}
      initialStep={Math.min(3, Math.max(1, profile.onboarding_step)) - 1}
      askName={!profile.first_name}
    />
  );
}
