/**
 * Application rules. Pure functions with no UI or database in them, so the same
 * code can run in a server action, a cron job, or a React component.
 *
 * RULE: "Needs a nudge" is never stored. It is derived: status is Applied and
 * the last activity is NUDGE_AFTER_DAYS or more days old.
 */
import { parseISO, today } from "@/lib/dates";
import type { Application, Bucket } from "@/lib/types";

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
