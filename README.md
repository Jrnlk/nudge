# Nudge

A calm job search and career app. "Everything for your job search and career, without the noise." Working name, still open.

## Getting started

1. Do the one-time setup in **[SETUP.md](SETUP.md)** (Supabase keys, database migration, Google and Microsoft sign-in).
2. Then:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:3000/login and create an account.

`.env.local` needs only two values (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or sb_publishable_ key>
```

## What exists today

- **Real:** sign-in and sign-up (Google, Microsoft, email + password, password reset), the four-step onboarding, the **Job search** application tracker (add, edit, change status, archive, delete, search), and placeholder **Today** and **Career** pages that read your saved data from Supabase. Data is protected by Row Level Security.
- **Real logic:** the "Needs a nudge" rule (`lib/services/applications.ts`) and reading job details from links (`lib/services/prefill.ts`).
- **Still demo data:** People and Ask Nudge read made-up data from `lib/store.tsx`, and Target companies are kept in the browser only. None of these persist.
- **Stubs only:** the API routes under `app/api/` (except prefill), Ask Nudge, reminders cron.

See [TASKS.md](TASKS.md) for what's next. Product docs are in [docs/](docs/). How sign-in works with Supabase, Google, and Microsoft: [docs/AUTH.md](docs/AUTH.md). How the application tracker works: [docs/TRACKER.md](docs/TRACKER.md).

## How routing works

- Signed out → `/login` (enforced in `proxy.ts`, the Next 16 name for middleware).
- Signed in, onboarding not finished → `/onboarding`, resuming at the saved step.
- Signed in, finished → `/today`, or `/career` for people who chose "Settled in a job" and added no applications (`lib/routing.ts`).

## Layout

```
proxy.ts                      session refresh + signed-out redirect (Next 16 "middleware")
app/
  (marketing)/page.tsx        landing
  (auth)/login                sign in / sign up (one page); /signup redirects here
  auth/callback               OAuth + PKCE email links: code -> session
  auth/confirm                email links with token_hash (confirm, reset)
  auth/continue, signout      post-sign-in routing; POST to sign out
  auth/reset-password         choose a new password
  onboarding/                 4-step setup (page + server actions)
  (app)/today, career         placeholders on real data
  (app)/search                application tracker (page + server actions)
  (app)/people, ask           still demo data
components/
  auth/                       login screen, provider buttons
  onboarding/                 the step flow and each step
  ui/                         primitives
lib/
  supabase/                   browser + server clients, proxy helper, DB types
  auth.ts, routing.ts         getUser/requireUser, where a person belongs
  onboarding.ts               option lists + server-side validation
  services/                   pure business rules (no UI, no DB)
supabase/
  migrations/                 SQL to run once (see SETUP.md)
  verify_rls.sql              check that users can't see each other's rows
```

## Design

Colors, radii, and the font are tokens at the top of `app/globals.css`. The app name is one constant in `components/ui/Logo.tsx`.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth via `@supabase/ssr`). Planned: Anthropic API, Vercel.
