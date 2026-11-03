/**
 * Application rules. Pure functions with no UI or database in them, so the same
 * code can run in a server action, a cron job, or a React component.
 *
 * RULE: "Needs a nudge" is never stored. It is derived: status is Applied and
 * the last activity is NUDGE_AFTER_DAYS or more days old.
 */
import { parseISO, toISO, today } from "@/lib/dates";
import type { ApplicationRow } from "@/lib/supabase/database.types";
import type { Application, Bucket, Status } from "@/lib/types";

export const NUDGE_AFTER_DAYS = 7;

export interface StatusMeta {
  key: Bucket;
  /** CSS color token, see app/globals.css */
  color: string;
  /** Derived statuses cannot be chosen by hand. */
  derived?: boolean;
}

export const STATUSES: StatusMeta[] = [
  { key: "Researching", color: "var(--s-research)" },
  { key: "Applied", color: "var(--s-applied)" },
  { key: "Interviewing", color: "var(--s-interview)" },
  { key: "Needs a nudge", color: "var(--s-follow)", derived: true },
  { key: "Offer", color: "var(--s-offer)" },
  { key: "Rejected", color: "var(--s-rejected)" },
  { key: "Archived", color: "var(--s-closed)" },
];

/** Statuses a person can set by hand. */
export const SETTABLE = STATUSES.filter((s) => !s.derived);

export const statusColor = (key: Bucket) =>
  (STATUSES.find((s) => s.key === key) ?? STATUSES[0]).color;

export function followUpDate(a: Application): Date | null {
  if (a.status !== "Applied") return null;
  const last = parseISO(a.lastActivity) ?? parseISO(a.dateApplied);
  if (!last) return null;
  last.setDate(last.getDate() + NUDGE_AFTER_DAYS);
  return last;
}

export function isDue(a: Application): boolean {
  const f = followUpDate(a);
  return !!f && f <= today();
}

export function bucketOf(a: Application): Bucket {
  return isDue(a) ? "Needs a nudge" : a.status;
}

export const isActive = (a: Application) =>
  a.status !== "Archived" && a.status !== "Rejected";

// ---------------------------------------------------------------------------
// Saving: validation, activity dates, and database row mapping.
// The server actions run these; the form runs validateApplication too, so
// people see problems before anything is sent.
// ---------------------------------------------------------------------------

export const LIMITS = { company: 200, role: 200, location: 200, source: 120, notes: 5000, link: 2048 } as const;

/** What the add/edit form sends. Every value is a raw string from an input. */
export interface ApplicationInput {
  company: string;
  role: string;
  location: string;
  status: string;
  dateApplied: string;
  source: string;
  link: string;
  notes: string;
}

export type FieldErrors = Partial<Record<keyof ApplicationInput, string>>;

/** Columns a person controls. user_id, last_activity, and timestamps are set elsewhere. */
export interface CleanApplication {
  company: string;
  role: string | null;
  location: string | null;
  status: Status;
  date_applied: string | null;
  source: string | null;
  posting_url: string | null;
  notes: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isStatus = (v: unknown): v is Status =>
  typeof v === "string" && SETTABLE.some((s) => s.key === v);

export function isISODate(v: string): boolean {
  if (!ISO_DATE.test(v)) return false;
  const d = parseISO(v);
  return !!d && toISO(d) === v; // rejects 2026-02-31
}

/**
 * Only http(s) links. "careers.acme.com/123" gets https:// in front;
 * anything with another scheme (javascript:, data:, mailto:) is refused.
 */
export function normalizeLink(raw: string): { url: string | null; error?: string } {
  const s = raw.trim();
  if (!s) return { url: null };
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(s);
  if (hasScheme && !/^https?:\/\//i.test(s)) return { url: null, error: "Use a web link that starts with http:// or https://." };
  try {
    const u = new URL(hasScheme ? s : `https://${s}`);
    if ((u.protocol !== "http:" && u.protocol !== "https:") || !u.hostname.includes(".")) throw new Error();
    const href = u.toString();
    if (href.length > LIMITS.link) return { url: null, error: "That link is too long." };
    return { url: href };
  } catch {
    return { url: null, error: "That doesn't look like a web link. Check it and try again." };
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Trim, check, and convert form values. `today` is YYYY-MM-DD in the person's time zone. */
export function validateApplication(
  raw: unknown,
  today: string,
): { ok: true; value: CleanApplication } | { ok: false; errors: FieldErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const v = {
    company: str(r.company),
    role: str(r.role),
    location: str(r.location),
    status: str(r.status) || "Applied",
    dateApplied: str(r.dateApplied),
    source: str(r.source),
    link: str(r.link),
    notes: str(r.notes),
  };
  const errors: FieldErrors = {};
  const tooLong = (k: keyof typeof LIMITS & keyof ApplicationInput, label: string) => {
    if (v[k].length > LIMITS[k]) errors[k] = `${label} can be up to ${LIMITS[k]} characters.`;
  };

  if (!v.company) errors.company = "Add the company name.";
  tooLong("company", "Company");
  tooLong("role", "Role");
  tooLong("location", "Location");
  tooLong("source", "Source");
  tooLong("notes", "Notes");
  if (!isStatus(v.status)) errors.status = "Pick a status from the list.";
  if (v.dateApplied) {
    if (!isISODate(v.dateApplied)) errors.dateApplied = "Enter a real date.";
    else if (v.dateApplied > today) errors.dateApplied = "That date is in the future.";
  }
  const link = normalizeLink(v.link);
  if (link.error) errors.link = link.error;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      company: v.company,
      role: v.role || null,
      location: v.location || null,
      status: v.status as Status,
      date_applied: v.dateApplied || null,
      source: v.source || null,
      posting_url: link.url,
      notes: v.notes || null,
    },
  };
}

type Previous = Pick<ApplicationRow, "status" | "notes" | "date_applied" | "last_activity">;

/**
 * Fills in the dates "Needs a nudge" will rely on:
 *  - Applied with no date applied -> today.
 *  - last_activity -> today when the status changes or the notes are edited.
 *    A new row starts at its date applied (or today), so an old application
 *    added late doesn't look freshly active.
 *  - last_activity is never earlier than date_applied.
 */
export function withActivity(next: CleanApplication, prev: Previous | null, today: string) {
  const date_applied = next.date_applied ?? (next.status === "Applied" ? today : null);
  let last_activity: string;
  if (!prev) last_activity = date_applied ?? today;
  else {
    const changed = next.status !== prev.status || (next.notes ?? "") !== (prev.notes ?? "");
    last_activity = changed ? today : (prev.last_activity ?? date_applied ?? today);
  }
  if (date_applied && last_activity < date_applied) last_activity = date_applied;
  return { ...next, date_applied, last_activity };
}

/** Database row -> the shape the UI uses. */
export function toApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role ?? "",
    location: row.location ?? undefined,
    status: row.status,
    link: row.posting_url ?? undefined,
    dateApplied: row.date_applied ?? undefined,
    lastActivity: row.last_activity ?? undefined,
    source: row.source ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

/** The form's starting values for an existing application (or a new one). */
export function toInput(a?: Application): ApplicationInput {
  return {
    company: a?.company ?? "",
    role: a?.role ?? "",
    location: a?.location ?? "",
    status: a?.status ?? "Applied",
    dateApplied: a?.dateApplied ?? "",
    source: a?.source ?? "",
    link: a?.link ?? "",
    notes: a?.notes ?? "",
  };
}

/** Search across company, role, and notes. */
export function matchesQuery(a: Application, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [a.company, a.role, a.notes].some((s) => s?.toLowerCase().includes(q));
}
