import { fmtShort } from "@/lib/dates";
import { isDue, statusColor, toApplication } from "@/lib/services/applications";
import type { ApplicationRow } from "@/lib/supabase/database.types";

/** Uses the existing rule in lib/services/applications.ts: Applied + 7 days quiet = needs a nudge. */
export function needsNudge(a: ApplicationRow): boolean {
  return isDue(toApplication(a));
}

/** Read-only list of saved applications (Today and Career placeholders). The full tracker is on Job search. */
export function SavedApplications({ apps }: { apps: ApplicationRow[] }) {
  return (
    <ul className="grid gap-2">
      {apps.map((a) => {
        const nudge = needsNudge(a);
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-tile bg-soft px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-extrabold">{a.company}</p>
              <p className="truncate text-[14px] text-muted">
                {[a.role, a.date_applied ? `Applied ${fmtShort(a.date_applied)}` : null].filter(Boolean).join(" · ") || " "}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nudge && (
                <span className="chip" data-nudge="true" style={{ "--c": "var(--s-follow)" } as React.CSSProperties}>
                  Needs a nudge
                </span>
              )}
              <span className="chip" style={{ "--c": statusColor(a.status) } as React.CSSProperties}>
                {a.status}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
