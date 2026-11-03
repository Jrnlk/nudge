import { SavedApplications } from "@/components/SavedApplications";
import { Card, EmptyState } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";

/**
 * Placeholder Career screen: greeting, where they want to be next (the first
 * target role from onboarding), and their saved applications.
 */
export default async function CareerPage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: apps }] = await Promise.all([
    supabase.from("profiles").select("first_name, target_roles").eq("id", user.id).maybeSingle(),
    supabase.from("applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const first = profile?.first_name;
  const next = profile?.target_roles?.[0];
  const list = apps ?? [];

  return (
    <>
      <h1 className="mb-1 text-[clamp(26px,4vw,34px)] font-extrabold leading-tight">
        Your career{first ? `, ${first}` : ""}
      </h1>
      <p className="mb-6 text-muted">One calm place for where you are and where you&apos;re headed.</p>

      <div className="grid gap-5">
        <Card title="Where you want to be next">
          {next ? (
            <p className="text-[17px] font-bold">{next}</p>
          ) : (
            <p className="text-muted">Not set yet. You can add a goal here soon.</p>
          )}
        </Card>

        <Card title="Your applications">
          {list.length ? (
            <SavedApplications apps={list} />
          ) : (
            <EmptyState>
              <p>No applications yet. That&apos;s fine if you&apos;re not searching right now.</p>
            </EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
