# Tasks

Follows the build order in CLAUDE.md. Check things off as you go.

## Before you write more code
- [ ] Read `docs/product-brief.md` (positioning, features, open questions)
- [ ] Click through the running app once, then compare with `docs/prototype.html`
- [ ] Decide the name and the visual direction (tokens live in `app/globals.css`, name in `components/ui/Logo.tsx`)
- [ ] Start the 10 to 15 job seeker interviews. They matter more than the next feature

## Phase 0: Decisions to make (unblocks everything else)
- [ ] Database host: Supabase or Neon
- [ ] ORM: Drizzle or Prisma
- [ ] Auth: Supabase Auth or Auth.js (pick together with the database, Supabase Auth is the shortest path if you choose Supabase)
- [ ] Create a git repo, a GitHub remote, and a Vercel project

## Phase 1: Auth and empty accounts
- [ ] Install the DB and auth packages, fill `.env.local` from `.env.example`
- [ ] Write `lib/db/schema.ts` and the first migration (users, applications, contacts, target_companies, goals, career_profiles)
- [ ] Implement `lib/auth.ts` (`getUser`, `requireUser`) and email plus Google sign-in
- [ ] Replace the fake submit in `components/AuthForm.tsx`
- [ ] Gate `app/(app)/layout.tsx`, redirect to `/login` when signed out
- [ ] New accounts start empty (the empty states already exist in the UI)
- [ ] Remove the "See the demo" shortcut or point it at a real demo account

## Phase 2: Application tracker plus prefill
- [ ] Applications CRUD in `app/api/applications` (and `[id]`), validated, always filtered by `user_id`
- [ ] Swap the store actions in `lib/store.tsx` to call the API (or server actions) and load real data
- [ ] Prefill: add rate limiting and require a session on `app/api/prefill`
- [x] Prefill: fix company names that run together ("Oceanspray"), at least show a "check this" hint
- [ ] Unit tests for `lib/services/applications.ts` and `lib/services/prefill.ts` (the SSRF checks especially)

## Phase 3: Today screen
- [ ] Load due follow-ups from the real data (the derivation already works)
- [ ] Reminder cron: `app/api/cron/reminders` plus `vercel.json` schedule, set `CRON_SECRET`
- [ ] Decide what a reminder is (email digest? in-app only?) and keep it quiet

## Phase 4 (v2): People, Career, Ask Nudge
- [ ] Contacts, target companies, goals, and career profile APIs
- [ ] Network web: handle 15+ nodes (zoom, filter, or group)
- [ ] Sankey: vertical layout on phones
- [ ] Ask Nudge route with the Anthropic SDK, server only, per-user rate limit, then streaming (`lib/ai/prompts.ts` has the prompt)

## Cross-cutting
- [ ] Mobile pass on every screen
- [ ] Accessibility pass (keyboard on the status menu, focus after dialogs close)
- [ ] Error and loading states (none exist yet)
- [ ] Remove `lib/mock/sample.ts` from production paths
- [ ] Before any public beta: privacy policy, terms, AI cost cap, and a decision on email access (Google and Microsoft app review)

## Things to understand first
1. **Product rules** (CLAUDE.md): "Needs a nudge" is derived, never stored. "Rejected" means a real rejection, quiet ones go to Archived. No LinkedIn or Indeed data. Calm over complete.
2. **Next.js App Router**: route groups like `(app)` don't affect the URL, `layout.tsx` wraps its children, files are server components unless they start with `"use client"`. Almost every screen is a client component right now because it reads the demo store. As real data arrives, move data loading to server components and keep only interactive pieces on the client.
3. **Route handlers and server actions**: `app/api/*/route.ts` is your backend. Server actions are an alternative for form-style writes.
4. **Tailwind v4 tokens**: colors are CSS variables in `app/globals.css` exposed as utilities (`bg-soft`, `text-muted`, `bg-st-follow`). Change the variable, the whole app follows.
5. **Multi-user data safety**: every table has a `user_id` and every query filters by it. One missed filter leaks someone's data. Postgres RLS is a good second line of defense.
6. **SSRF**: any endpoint that fetches a user-supplied URL can be aimed at internal addresses. `assertSafeUrl` is the start, resolve DNS and block private ranges before ever fetching a page.
7. **Secrets**: `ANTHROPIC_API_KEY` and database URLs stay on the server. Only variables prefixed `NEXT_PUBLIC_` reach the browser.
8. **Auth**: use a library, never store passwords yourself.
9. **Risks to flag early**: Gmail and Outlook app review, job listing data rights, AI cost per user, privacy policy and terms.
