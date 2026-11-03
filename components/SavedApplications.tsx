import { fmtShort } from "@/lib/dates";
import { isDue } from "@/lib/services/applications";
import type { ApplicationRow, ApplicationStatus } from "@/lib/supabase/database.types";
import type { Application } from "@/lib/types";

const STATUS: Record<ApplicationStatus, { label: string; color: string }> = {
  applied: { label: "Applied", color: "var(--s-applied)" },
  interviewing: { label: "Interviewing", color: "var(--s-interview)" },
  offer: { label: "Offer", color: "var(--s-offer)" },
  rejected: { label: "Rejected", color: "var(--s-rejected)" },
  not_applied: { label: "Not applied yet", color: "var(--s-research)" },
  archived: { label: "Archived", color: "var(--s-closed)" },
};

/** Uses the existing rule in lib/services/applications.ts: Applied + 7 days quiet = needs a nudge. */
export function needsNudge(a: ApplicationRow): boolean {
  const asDomain: Application = {
    id: a.id,
    company: a.company,
    role: a.role ?? "",
    status: a.status === "applied" ? "Applied" : "Interviewing",
    dateApplied: a.applied_on ?? undefined,
  };
  return isDue(asDomain);
}

/** Read-only list of saved applications (placeholder until the full tracker is wired up). */
export function SavedApplications({ apps }: { apps: ApplicationRow[] }) {
  return (
    <ul className="grid gap-2">
      {apps.map((a) => {
        const nudge = needsNudge(a);
        const s = STATUS[a.status];
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-tile bg-soft px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-extrabold">{a.company}</p>
              <p className="truncate text-[14px] text-muted">
                {[a.role, a.applied_on && a.status !== "not_applied" ? `Applied ${fmtShort(a.applied_on)}` : null]
                  .filter(Boolean)
                  .join(" · ") || " "}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nudge && (
                <span className="chip" data-nudge="true" style={{ "--c": "var(--s-follow)" } as React.CSSProperties}>
                  Needs a nudge
                </span>
              )}
              <span className="chip" style={{ "--c": s.color } as React.CSSProperties}>
                {s.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
