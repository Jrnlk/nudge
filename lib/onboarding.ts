/**
 * Onboarding answers: option lists shared by the UI and the server actions,
 * plus the validation the server runs before anything touches the database.
 * Pure functions only, safe to import on both sides.
 */
import type { ApplicationStatus, ProfileRow, Situation } from "@/lib/supabase/database.types";

export const MAX_ROLES = 3;

/** Situation, what you're looking for, jobs, and email options. */
export const ONBOARDING_STEPS = 4;

export const SITUATIONS: { value: Situation; label: string; hint: string }[] = [
  { value: "in_school", label: "In school or just graduated", hint: "Looking for an internship or a first job" },
  { value: "employed_looking", label: "Looking while I have a job", hint: "Searching alongside current work" },
  { value: "between_jobs", label: "Between jobs", hint: "Searching full-time" },
  { value: "settled", label: "Settled in a job", hint: "Planning my next step" },
];

export const TRACKING = [
  { value: "spreadsheet", label: "A spreadsheet" },
  { value: "notes_app", label: "A notes app" },
  { value: "job_app", label: "Another job app" },
  { value: "nothing", label: "Nothing yet" },
] as const;
export type Tracking = (typeof TRACKING)[number]["value"];

export const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "internship", label: "Internship" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
] as const;
export type JobType = (typeof JOB_TYPES)[number]["value"];

export const START_TIMINGS = [
  { value: "asap", label: "As soon as possible" },
  { value: "within_3_months", label: "Within 3 months" },
  { value: "later", label: "Later than that" },
] as const;
export type StartTiming = (typeof START_TIMINGS)[number]["value"];

export type DraftStatus = Exclude<ApplicationStatus, "Archived">;
export const ROW_STATUSES: { value: DraftStatus; label: string }[] = [
  { value: "Applied", label: "Applied" },
  { value: "Interviewing", label: "Interviewing" },
  { value: "Offer", label: "Offer" },
  { value: "Rejected", label: "Rejected" },
  { value: "Researching", label: "Not applied yet" },
];

/**
 * "Roughly when did you apply?" turned into an approximate date.
 * Last week uses 10 days ago so it is safely past the 7-day follow-up mark in
 * any time zone, which means it shows "Needs a nudge" right away (as the spec asks).
 */
export const WHEN = [
  { value: "this_week", label: "Applied this week", daysAgo: 0 },
  { value: "last_week", label: "Applied last week", daysAgo: 10 },
  { value: "earlier", label: "Applied earlier", daysAgo: 21 },
] as const;
export type When = (typeof WHEN)[number]["value"];

export interface Answers {
  firstName: string;
  situation: Situation | null;
  trackingMethod: Tracking | null;
  targetRoles: string[];
  location: string;
  openToRemote: boolean;
  jobTypes: JobType[];
  startTiming: StartTiming | null;
}

/** A job in the "Ready to add" list. Nothing is saved until the person presses Add. */
export interface DraftRow {
  key: string;
  company: string;
  role: string;
  location: string;
  postingUrl: string;
  /** How the row was added here (UI only, not saved). */
  source: "link" | "manual";
  status: DraftStatus;
  when: When;
  /** The company came from the link, so it may be run together ("Oceanspray"). */
  parsed: boolean;
}

export function answersFromProfile(p: ProfileRow): Answers {
  return {
    firstName: p.first_name ?? "",
    situation: p.situation,
    trackingMethod: oneOf(p.tracking_method, TRACKING),
    targetRoles: p.target_roles ?? [],
    location: p.location ?? "",
    openToRemote: p.open_to_remote,
    jobTypes: (p.job_types ?? []).filter((v): v is JobType => JOB_TYPES.some((o) => o.value === v)),
    startTiming: oneOf(p.start_timing, START_TIMINGS),
  };
}

// ---------------------------------------------------------------------------
// Server-side validation. Inputs come from the browser, so trust nothing.
// ---------------------------------------------------------------------------

function oneOf<T extends string>(v: unknown, options: readonly { value: T }[]): T | null {
  return typeof v === "string" && options.some((o) => o.value === v) ? (v as T) : null;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function cleanAnswers(raw: unknown) {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const roles = Array.isArray(a.targetRoles) ? a.targetRoles.map((r) => text(r, 80)).filter(Boolean) : [];
  const jobTypes = Array.isArray(a.jobTypes) ? a.jobTypes.map((j) => oneOf(j, JOB_TYPES)).filter((j) => j !== null) : [];
  return {
    first_name: text(a.firstName, 80) || null,
    situation: oneOf(a.situation, SITUATIONS),
    tracking_method: oneOf(a.trackingMethod, TRACKING),
    target_roles: [...new Set(roles)].slice(0, MAX_ROLES),
    location: text(a.location, 120) || null,
    open_to_remote: a.openToRemote === true,
    job_types: [...new Set(jobTypes)],
    start_timing: oneOf(a.startTiming, START_TIMINGS),
  };
}

function safeHttpUrl(v: unknown): string | null {
  const s = text(v, 2048);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The person's local "today" if it is believable, otherwise the server's (UTC) date. */
export function baseDate(clientToday: unknown): Date {
  const server = new Date();
  server.setUTCHours(0, 0, 0, 0);
  if (typeof clientToday === "string" && ISO_DATE.test(clientToday)) {
    const d = new Date(`${clientToday}T00:00:00Z`);
    if (!Number.isNaN(d.getTime()) && Math.abs(d.getTime() - server.getTime()) <= 2 * 86_400_000) return d;
  }
  return server;
}

export function cleanRows(raw: unknown, base: Date) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 100).flatMap((r) => {
    const row = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
    const company = text(row.company, 200);
    if (!company) return []; // Rows without a company are left out until one is added.
    const status = oneOf(row.status, ROW_STATUSES) ?? "Applied";
    const when = WHEN.find((w) => w.value === row.when) ?? WHEN[0];
    const applied = new Date(base);
    applied.setUTCDate(applied.getUTCDate() - when.daysAgo);
    const date_applied = status === "Researching" ? null : applied.toISOString().slice(0, 10);
    return [
      {
        company,
        role: text(row.role, 200) || null,
        location: text(row.location, 200) || null,
        posting_url: safeHttpUrl(row.postingUrl),
        status: status as ApplicationStatus,
        date_applied,
        // Nothing has happened since applying, so the nudge clock starts there.
        last_activity: date_applied ?? base.toISOString().slice(0, 10),
      },
    ];
  });
}
