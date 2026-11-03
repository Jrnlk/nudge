-- Nudge: profiles + applications, with Row Level Security.
-- Safe to run once on an empty project (checked 2026-11-03: no public tables yet).
-- Run it in Supabase -> SQL Editor, or with `npx supabase db push` once the CLI is linked.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.situation as enum ('in_school', 'employed_looking', 'between_jobs', 'settled');
create type public.application_status as enum ('applied', 'interviewing', 'offer', 'rejected', 'not_applied', 'archived');
create type public.application_source as enum ('link', 'manual', 'email');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text check (char_length(first_name) <= 80),
  situation public.situation,
  -- User research only ("What have you used to keep track so far?")
  tracking_method text check (tracking_method in ('spreadsheet', 'notes_app', 'job_app', 'nothing')),
  target_roles text[] not null default '{}' check (cardinality(target_roles) <= 3),
  location text check (char_length(location) <= 120),
  open_to_remote boolean not null default false,
  job_types text[] not null default '{}'
    check (job_types <@ array['full_time', 'internship', 'part_time', 'contract']),
  start_timing text check (start_timing in ('asap', 'within_3_months', 'later')),
  onboarding_step int not null default 1 check (onboarding_step between 1 and 3),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (char_length(btrim(company)) between 1 and 200),
  role text check (char_length(role) <= 200),
  location text check (char_length(location) <= 200),
  status public.application_status not null default 'applied',
  -- Approximate when it came from onboarding ("This week" / "Last week" / "Earlier").
  applied_on date,
  posting_url text check (char_length(posting_url) <= 2048),
  source public.application_source not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile for every new auth user.
-- Takes the first word of whatever name the sign-up method provided.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    nullif(
      left(split_part(btrim(coalesce(
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'given_name',
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      )), ' ', 1), 80),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Only the trigger should call it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users created before this migration (none at time of writing).
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security: each person can only see and change their own rows.
-- The anon role gets no policies, so signed-out requests see nothing.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.applications enable row level security;

create policy "profiles: select own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles: delete own" on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

create policy "applications: select own" on public.applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "applications: insert own" on public.applications
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "applications: update own" on public.applications
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "applications: delete own" on public.applications
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Table privileges for the Data API (RLS above still decides which rows).
revoke all on public.profiles, public.applications from anon;
grant select, insert, update, delete on public.profiles, public.applications to authenticated;
