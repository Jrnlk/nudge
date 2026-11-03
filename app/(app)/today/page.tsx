import Link from "next/link";
import { needsNudge, SavedApplications } from "@/components/SavedApplications";
import { Card, EmptyState } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";

/**
 * Placeholder Today screen: greeting + the applications saved during onboarding.
 * The full dashboard (Needs you today, stats, Sankey) comes later.
 */
export default async function TodayPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: apps }] = await Promise.all([
    supabase.from("profiles").select("first_name, situation").eq("id", user.id).maybeSingle(),
    supabase.from("applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const list = apps ?? [];
  const due = list.filter(needsNudge);
  const first = profile?.first_name;

  return (
    <>
      <h1 className="mb-4 text-[clamp(26px,4vw,34px)] font-extrabold leading-tight">
        Good to see you{first ? `, ${first}` : ""}
      </h1>

      {due.length > 0 && (
        <p className="mb-6 rounded-tile bg-hero px-4 py-3 text-[14.5px]">
          {due.length === 1 ? `${due[0].company} has` : `${due.length} applications have`} gone quiet for a week. A short
          follow-up today could make the difference.
        </p>
      )}

      <Card title="Your applications">
        {list.length ? (
          <SavedApplications apps={list} />
        ) : profile?.situation === "settled" ? (
          <EmptyState title="Nothing to track yet">
            <p>
              You&apos;re settled in, so a good first step is a goal.{" "}
              <Link href="/career" className="font-bold text-ink">
                Set one in Career
              </Link>
              .
            </p>
          </EmptyState>
        ) : (
          <EmptyState title="Nothing here yet">
            <p>Add your first application and Nudge will keep an eye on it.</p>
          </EmptyState>
        )}
      </Card>
    </>
  );
}
