"use server";
/**
 * Application tracker reads and writes. Runs on the server with the signed-in
 * person's session (never the service role key). Every query filters by
 * user_id, and Row Level Security enforces the same rule in the database.
 */
import { requireUser } from "@/lib/auth";
import { baseDate } from "@/lib/onboarding";
import {
  isStatus,
  toApplication,
  validateApplication,
  withActivity,
  type FieldErrors,
} from "@/lib/services/applications";
import type { Application, Status } from "@/lib/types";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: FieldErrors };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAVE_FAILED = "We couldn't save that just now. Your changes are still here, so try again in a moment.";
const GONE = "That application isn't in your list anymore. It may have been deleted in another tab.";

/** The person's local date if it is believable, otherwise the server's. */
const todayFrom = (clientToday: unknown) => baseDate(clientToday).toISOString().slice(0, 10);

export async function listApplications(): Promise<Result<Application[]>> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return { ok: false, error: "We couldn't load your applications just now." };
  return { ok: true, data: data.map(toApplication) };
}

/** Add (id = null) or edit an application from the form. */
export async function saveApplication(id: string | null, input: unknown, clientToday: unknown): Promise<Result<Application>> {
  const { supabase, user } = await requireUser();
  const today = todayFrom(clientToday);
  const checked = validateApplication(input, today);
  if (!checked.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: checked.errors };

  if (!id) {
    const { data, error } = await supabase
      .from("applications")
      .insert({ ...withActivity(checked.value, null, today), user_id: user.id })
      .select("*")
      .single();
    if (error) return { ok: false, error: SAVE_FAILED };
    return { ok: true, data: toApplication(data) };
  }

  if (!UUID.test(id)) return { ok: false, error: GONE };
  const { data: prev, error: readError } = await supabase
    .from("applications")
    .select("status, notes, date_applied, last_activity")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) return { ok: false, error: SAVE_FAILED };
  if (!prev) return { ok: false, error: GONE };

  const { data, error } = await supabase
    .from("applications")
    .update(withActivity(checked.value, prev, today))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, error: SAVE_FAILED };
  if (!data) return { ok: false, error: GONE };
  return { ok: true, data: toApplication(data) };
}

/** Quick status change from the status chip. */
export async function setApplicationStatus(id: string, status: Status, clientToday: unknown): Promise<Result<Application>> {
  const { supabase, user } = await requireUser();
  if (!UUID.test(id)) return { ok: false, error: GONE };
  if (!isStatus(status)) return { ok: false, error: "Pick a status from the list." };
  const today = todayFrom(clientToday);

  const { data: prev, error: readError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) return { ok: false, error: SAVE_FAILED };
  if (!prev) return { ok: false, error: GONE };

  const next = withActivity(
    {
      company: prev.company,
      role: prev.role,
      location: prev.location,
      status,
      date_applied: prev.date_applied,
      source: prev.source,
      posting_url: prev.posting_url,
      notes: prev.notes,
    },
    prev,
    today,
  );
  const { data, error } = await supabase
    .from("applications")
    .update({ status: next.status, date_applied: next.date_applied, last_activity: next.last_activity })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, error: SAVE_FAILED };
  if (!data) return { ok: false, error: GONE };
  return { ok: true, data: toApplication(data) };
}

export async function deleteApplication(id: string): Promise<Result<null>> {
  const { supabase, user } = await requireUser();
  if (!UUID.test(id)) return { ok: true, data: null };
  const { error } = await supabase.from("applications").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: "We couldn't delete that just now. Try again in a moment." };
  return { ok: true, data: null };
}
