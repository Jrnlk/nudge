/*
  TODO: database schema. Not wired up yet, pick an ORM first (Drizzle or Prisma).

  Tables (v1), each with a user_id that EVERY query filters on:
    users            id, email, name, created_at          (or use the auth provider's table)
    applications     id, user_id, company, role, location, status, link, date_applied,
                     last_activity, notes, created_at
    contacts         id, user_id, name, org, relationship, next_step
    target_companies id, user_id, name, category, priority, state
    goals            id, user_id, text, done
    career_profiles  user_id (unique), company, title, next

  Rules:
    - status is one of: Researching, Applied, Interviewing, Offer, Rejected, Archived.
      "Needs a nudge" is NOT a column value. See lib/services/applications.ts.
    - If you use Supabase, turn on Row Level Security with user_id = auth.uid() on every table.
    - Keep the row shapes compatible with lib/types.ts.
*/
export {};
