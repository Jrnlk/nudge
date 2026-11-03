# Nudge

A calm job search and career app. "Your whole career, one calm place." Working name, still open.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Click "See the demo" to jump into the app with sample data.

## What exists today

- **Front end:** landing, sign up, log in, Today, Job search, People (with network web), Career, Ask Nudge. All run on made-up demo data held in memory (`lib/store.tsx`). Nothing persists on reload.
- **Real logic:** the "Needs a nudge" derivation (`lib/services/applications.ts`) and link prefill with URL validation (`lib/services/prefill.ts`, `app/api/prefill`).
- **Stubs only:** database, auth, Ask Nudge, applications and contacts APIs, reminders cron. Each file says what to build in a TODO comment.

See [TASKS.md](TASKS.md) for what to do next.

## Layout

```
app/
  (marketing)/page.tsx       landing
  (auth)/login, signup
  (app)/today, search, people, career, ask    signed-in screens (shared layout + nav)
  api/applications, contacts, prefill, ask, cron/reminders
components/                  UI pieces; ui/ has the primitives, charts/ the visualizations
lib/
  types.ts                   domain types
  services/                  pure business rules (no UI, no DB)
  store.tsx                  temporary client store, replace with real data calls
  mock/sample.ts             demo data
  db/, auth.ts, ai/          backend placeholders
```

## Design

Colors, radii, and the font are tokens at the top of `app/globals.css`. The app name is one constant in `components/ui/Logo.tsx`. Both are meant to change.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, ESLint. Planned: Postgres, Auth, Anthropic API, Vercel.
