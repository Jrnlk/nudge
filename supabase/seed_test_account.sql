-- Seed (or reset) a test account with a finished onboarding and sample applications.
--
-- 1. Create the user first: Supabase -> Authentication -> Users -> Add user ->
--    Create new user, tick "Auto Confirm User". The sign-up trigger makes the profile row.
-- 2. Put that email below and run this whole file in the SQL editor.
--
-- Safe to re-run: it replaces this account's applications every time.
-- Dates are relative to today, so "Needs a nudge" always has something in it.

do $$
declare
  test_email text := 'you+nudgetest@gmail.com';  -- <- change me
  uid uuid;
begin
  select id into uid from auth.users where email = test_email;
  if uid is null then
    raise exception 'No user with email %. Create it in Authentication -> Users first.', test_email;
  end if;

  insert into public.profiles (id) values (uid) on conflict (id) do nothing;

  update public.profiles set
    first_name = 'Test',
    situation = 'between_jobs',
    tracking_method = 'spreadsheet',
    target_roles = array['Product Designer', 'UX Researcher'],
    location = 'Boston, MA',
    open_to_remote = true,
    job_types = array['full_time', 'contract'],
    start_timing = 'asap',
    onboarding_step = 4,
    onboarding_completed_at = now()
  where id = uid;

  delete from public.applications where user_id = uid;

  insert into public.applications
    (user_id, company, role, location, status, date_applied, last_activity, source, posting_url, notes)
  values
    -- Applied more than 7 days ago with no activity: these show as "Needs a nudge".
    (uid, 'Ocean Spray', 'Product Designer', 'Lakeville, MA', 'Applied',
      current_date - 12, current_date - 12, 'Company site', 'https://example.com/jobs/ocean-spray', null),
    (uid, 'HubSpot', 'UX Researcher', 'Remote', 'Applied',
      current_date - 9, current_date - 9, 'Referral', null, 'Referred by Sam from the design meetup.'),
    -- Applied recently: plain "Applied".
    (uid, 'Wayfair', 'Product Designer II', 'Boston, MA', 'Applied',
      current_date - 3, current_date - 3, 'Company site', null, null),
    (uid, 'Klaviyo', 'Product Designer', 'Boston, MA', 'Applied',
      current_date - 1, current_date - 1, 'Job board', null, null),
    -- Further along.
    (uid, 'Toast', 'Senior Product Designer', 'Boston, MA', 'Interviewing',
      current_date - 18, current_date - 2, 'Company site', null, 'Portfolio review on Thursday.'),
    (uid, 'Rapid7', 'UX Designer', 'Boston, MA', 'Offer',
      current_date - 30, current_date - 1, 'Referral', null, 'Offer deadline is next Friday.'),
    -- Not applied yet, rejected, and archived.
    (uid, 'Duolingo', 'Product Designer', 'Remote', 'Researching',
      null, current_date, null, null, 'Ask Priya what the team is like.'),
    (uid, 'DraftKings', 'Product Designer', 'Boston, MA', 'Rejected',
      current_date - 25, current_date - 6, 'Job board', null, null),
    (uid, 'Chewy', 'UX Designer', 'Remote', 'Archived',
      current_date - 45, current_date - 45, 'Job board', null, 'Never heard back.');
end $$;
