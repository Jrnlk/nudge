/**
 * Domain types. These mirror the v1 data model in CLAUDE.md.
 * When the database lands, lib/db/schema.ts should produce rows that fit these
 * shapes (add `userId` there, not here: the UI never needs it).
 */

/** Stored statuses. "Needs a nudge" is NOT here on purpose, it is derived. */
export type Status =
  | "Researching"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Archived";

/** What the UI shows: a stored status, or the derived "Needs a nudge". */
export type Bucket = Status | "Needs a nudge";

export interface Application {
  id: string;
  company: string;
  role: string;
  location?: string;
  status: Status;
  link?: string;
  /** ISO date, YYYY-MM-DD */
  dateApplied?: string;
  /** ISO date, YYYY-MM-DD */
  lastActivity?: string;
  /** Where the job was found, e.g. "Company site", "Referral". */
  source?: string;
  notes?: string;
  /** ISO timestamp, for sorting. */
  updatedAt?: string;
}

export interface Contact {
  id: string;
  name: string;
  org?: string;
  relationship?: string;
  nextStep?: string;
}

export type Priority = "High" | "Medium" | "Low" | "";

export interface TargetCompany {
  id: string;
  name: string;
  category?: string;
  priority?: Priority;
  state?: "Researching" | "Ready to apply" | "Applied" | "Not a fit";
}

export interface CareerProfile {
  company: string;
  title: string;
  next: string;
}

export interface Goal {
  id: string;
  text: string;
  done: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export interface AppData {
  apps: Application[];
  people: Contact[];
  companies: TargetCompany[];
  career: CareerProfile;
  goals: Goal[];
}

export type EntityKind = "apps" | "people" | "companies";
