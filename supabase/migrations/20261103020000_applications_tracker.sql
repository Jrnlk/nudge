-- Nudge: reshape public.applications for the real tracker, and add a 4th onboarding step.
--
-- Run AFTER 20261103000000_profiles_applications.sql and 20261103010000_tighten_grants.sql.
-- Checked 2026-11-03: the live table had 0 rows, but the statements below keep any rows anyway.
-- Everything runs in one transaction: if any line fails, nothing changes.

begin;

-- ---------------------------------------------------------------------------
-- status: enum (lowercase, 'not_applied') -> text with a check (Title Case, 'Researching').
-- "Needs a nudge" is NOT a status. It is derived in lib/services/applications.ts.
-- ---------------------------------------------------------------------------
alter table public.applications alter column status drop default;
alter table public.applications
  alter column status type text
  using (case status::text when 'not_applied' then 'Researching' else initcap(status::text) end);
alter table public.applications alter column status set default 'Applied';
alter table public.applications
  add constraint applications_status_check
  check (status in ('Researching', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Archived'));

-- ---------------------------------------------------------------------------
-- Dates: applied_on -> date_applied, plus last_activity (both feed the future "Needs a nudge").
-- ---------------------------------------------------------------------------
alter table public.applications rename column applied_on to date_applied;
alter table public.applications add column last_activity date;
update public.applications set last_activity = coalesce(date_applied, created_at::date);

-- ---------------------------------------------------------------------------
-- source: enum (how the row was entered) -> free text (where the job was found,
-- e.g. "Company site", "Referral"). The old values don't mean that, so they are dropped.
-- ---------------------------------------------------------------------------
alter table public.applications alter column source drop default;
alter table public.applications alter column source drop not null;
alter table public.applications alter column source type text using null;
alter table public.applications
  add constraint applications_source_check check (char_length(source) <= 120);

-- Only web links. The app validates too; this is the backstop.
alter table public.applications
  add constraint applications_posting_url_scheme_check check (posting_url ~* '^https?://');

alter table public.applications
  add constraint applications_notes_check check (char_length(notes) <= 5000);

drop type public.application_status;
drop type public.application_source;

-- ---------------------------------------------------------------------------
-- Indexes for "my list by status" and "my list, most recently changed first".
-- (user_id, status) also covers plain user_id lookups, so the old index goes.
-- ---------------------------------------------------------------------------
drop index if exists public.applications_user_id_idx;
create index applications_user_id_status_idx on public.applications (user_id, status);
create index applications_user_id_updated_at_idx on public.applications (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Onboarding gains a 4th step ("Keep your tracker up to date automatically").
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint profiles_onboarding_step_check;
alter table public.profiles
  add constraint profiles_onboarding_step_check check (onboarding_step between 1 and 4);

-- Unchanged from the first migration and still in force:
--   * RLS on, with select/insert/update/delete policies limited to auth.uid() = user_id
--   * anon has no privileges and no policies (signed-out requests see nothing)
--   * updated_at trigger (applications_set_updated_at)
--   * profiles row created by the on_auth_user_created trigger for every sign-up method

commit;
