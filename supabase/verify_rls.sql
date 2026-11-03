-- Quick RLS check. Run in Supabase -> SQL Editor AFTER you have two users
-- (sign up twice, e.g. with Google and with email) and each has added at least
-- one application. Nothing here changes data: everything runs in a transaction
-- that is rolled back.

-- 1) See who exists (the SQL Editor runs as an admin, so it sees everything):
select u.id, u.email, count(a.id) as applications
from auth.users u
left join public.applications a on a.user_id = u.id
group by u.id, u.email;

-- 2) Pretend to be user A and try to read everything.
--    Replace the uuid below with user A's id from step 1, then run steps 2 together.
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', 'PASTE-USER-A-UUID', 'role', 'authenticated')::text, true);

  -- Expect: only user A's rows.
  select user_id, company, role from public.applications;
  select id, first_name from public.profiles;

  -- Expect: 0 rows updated (user B's rows are invisible to A).
  update public.applications set notes = 'hacked' where user_id <> auth.uid();
  -- Expect: an error "new row violates row-level security policy".
  -- insert into public.applications (user_id, company) values ('PASTE-USER-B-UUID', 'Should fail');
rollback;

-- 3) Signed-out visitors see nothing:
begin;
  set local role anon;
  select count(*) from public.applications; -- Expect: permission denied
rollback;
