/**
 * Database types, hand-written to match supabase/migrations.
 * Regenerate instead once the Supabase CLI is linked:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
 */

export type Situation = "in_school" | "employed_looking" | "between_jobs" | "settled";
export type ApplicationStatus = "applied" | "interviewing" | "offer" | "rejected" | "not_applied" | "archived";
export type ApplicationSource = "link" | "manual" | "email";

export type ProfileRow = {
  id: string;
  first_name: string | null;
  situation: Situation | null;
  tracking_method: string | null;
  target_roles: string[];
  location: string | null;
  open_to_remote: boolean;
  job_types: string[];
  start_timing: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationRow = {
  id: string;
  user_id: string;
  company: string;
  role: string | null;
  location: string | null;
  status: ApplicationStatus;
  applied_on: string | null;
  posting_url: string | null;
  source: ApplicationSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Insertable<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;

export type Database = {
  __InternalSupabase: { PostgrestVersion: "13" };
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow, "id">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      applications: {
        Row: ApplicationRow;
        Insert: Insertable<ApplicationRow, "company">;
        Update: Partial<ApplicationRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      situation: Situation;
      application_status: ApplicationStatus;
      application_source: ApplicationSource;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
