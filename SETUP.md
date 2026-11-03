# Setup

Everything you have to do by hand, in order. About 45 minutes the first time.

You need: Node.js 20.9+ (22 LTS recommended, supabase-js is dropping Node 20), a Supabase project, a Google account, and a Microsoft account.

Throughout this guide, **your Supabase callback URL** is:

```
https://qvwervnlgogmcdazhaps.supabase.co/auth/v1/callback
```

(You can also copy it from Supabase → **Authentication → Sign In / Providers → Google**, where it's shown as "Callback URL (for OAuth)". For a different project, swap in that project's ref.)

## Your progress

As of 2026-11-03:

- [x] **1. Connect the app to Supabase.** `.env.local` is filled in and the Data API is on.
- [x] **2. Database tables.** Both migrations are live, and Supabase's security check reports no issues.
- [x] **3. Redirect URL allow-list.**
- [ ] **4. Email sign-in.** Check two settings. About 2 minutes. (Custom SMTP and email templates can wait until before real users.)
- [ ] **5. Google sign-in.** Google Cloud OAuth client, then paste it into Supabase. About 10 minutes.
- [ ] **6. Microsoft sign-in.** Azure app registration, then paste it into Supabase. About 15 minutes.
- [ ] **7. Run the app.**
- [ ] **8. Test everything**, including the RLS check.

You can do 4 and 7 first and test email sign-up before setting up Google or Microsoft. Until a provider is turned on in Supabase, its button opens a plain Supabase error page ("provider is not enabled"). Press Back to return.

---

## 1. Connect the app to Supabase ✅ Done

1. In Supabase, click **Connect** → **Framework** → Next.js / App Router. If you see "Database access requires the Data API", click **Enable Data API**.
2. Copy `.env.example` to `.env.local` in the project root and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # or the legacy anon key
   ```

   - Both values are public by design. Row Level Security decides what each person can see.
   - **Never** put the `service_role` / secret key in this file or in any `NEXT_PUBLIC_` variable. The app doesn't need it.
   - `.env.local` is gitignored (`.env*` in `.gitignore`).

## 2. Create the database tables ✅ Done

> Already applied to your project, including the second migration, [`20261103010000_tighten_grants.sql`](supabase/migrations/20261103010000_tighten_grants.sql), which removes default permissions the app doesn't use. These steps are kept for a fresh project. In a new project, run both files in order.

1. Supabase → **SQL Editor** → **New query**.
2. Paste the whole of [`supabase/migrations/20261103000000_profiles_applications.sql`](supabase/migrations/20261103000000_profiles_applications.sql) and click **Run**. You should see "Success. No rows returned".
3. Check **Table Editor**: you should have `profiles` and `applications`, both marked "RLS enabled".

The migration creates:
- `profiles` (one row per user, created automatically by a trigger on sign-up) and `applications`.
- Row Level Security on both tables: people can only select, insert, update, and delete their own rows. Signed-out requests can't read anything.

(If you later install the Supabase CLI, `npx supabase link` then `npx supabase db push` applies the same file.)

## 3. Redirect URL allow-list ✅ Done

> When you deploy, come back here to add the production URL and switch the Site URL.

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` for now. Change it to your production URL (for example `https://nudge.app`) when you deploy.
- **Redirect URLs**: add each of these:
  - `http://localhost:3000/**`
  - `https://<your-production-domain>/**`
  - Optional, for Vercel preview deploys: `https://*-<your-vercel-team>.vercel.app/**`

Sign-in only returns to addresses on this list.

## 4. Email and password sign-in ⬜ To do

Supabase → **Authentication → Sign In / Providers → Email**: make sure it's enabled. Keep **Confirm email** on.

**Heads-up about test emails:** Supabase's built-in email sender only delivers to the email addresses of your Supabase team members, and only a few per hour. For local testing, either:
- sign up with the email you use for Supabase, or
- set up custom SMTP (Authentication → Emails → SMTP Settings; Resend, Postmark, and others have free tiers). You'll need this before real users anyway.

**Update two email templates (later, once you have custom SMTP).** Supabase only lets you edit templates after custom SMTP is set up, so skip this for now. The default templates work as long as you open each link **in the same browser** that asked for it. If a confirmation link is opened somewhere else, your email still gets confirmed: just log in. When you have SMTP, go to Supabase → **Authentication → Emails → Templates**:

- **Confirm signup**: change the link to
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
  ```
- **Reset password**: change the link to
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>
  ```

With these, the links work even when opened in a different browser or on a phone. Without them, the default links still work, but only in the same browser that asked for them.

## 5. Google sign-in ⬜ To do

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (or pick one), for example "Nudge".
2. **Google Auth Platform → Branding** (the OAuth consent screen): app name "Nudge", your support email, developer contact email. **Audience**: External.
   - While the app is in **Testing**, only the test users you list under **Audience → Test users** can sign in. Add your own Google accounts, or click **Publish app**. The scopes Nudge uses (`openid`, `email`, `profile`) don't require Google's verification review.
3. **Google Auth Platform → Clients → Create client**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000` (add your production URL later)
   - Authorized redirect URIs: **your Supabase callback URL** (see the top of this file)
4. Copy the **Client ID** and **Client secret**.
5. Supabase → **Authentication → Sign In / Providers → Google**: enable it, paste the Client ID and secret, and click **Save**.

## 6. Microsoft (Outlook) sign-in ⬜ To do

This works for personal Microsoft accounts (Outlook.com, Hotmail, Live) **and** work or school accounts.

> If your school account can't create app registrations, sign in to the Azure portal with a **personal** Microsoft account instead. It gets a free directory you can use.

1. Go to the [Azure portal](https://portal.azure.com/) → **Microsoft Entra ID** → **App registrations** → **New registration**.
   - **Name**: Nudge
   - **Supported account types**: *Accounts in any organizational directory (Any Microsoft Entra ID tenant – Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)*. This is the "common" endpoint, which is what lets both kinds of accounts sign in.
   - **Redirect URI**: platform **Web**, value = **your Supabase callback URL**.
   - Click **Register**.
2. On the app's **Overview** page, copy the **Application (client) ID**.
3. **Certificates & secrets → Client secrets → New client secret**.
   - Description: "Supabase". Expires: pick one (180 days is recommended, 24 months is the maximum).
   - Copy the **Value** column right away. It's shown only once. (Not the "Secret ID".)
   - **Write the expiry date down here and put a reminder in your calendar two weeks before it:**
     `Microsoft client secret expires on: ____________`
   - When it expires, Microsoft sign-in stops working. To renew: create a new secret here, paste its value into Supabase (step 5), then delete the old secret.
4. **Only accept verified email addresses** (from Supabase's Azure guide). Go to **Token configuration → Add optional claim → Token type: ID**, tick **`email`** and **`xms_edov`** (shows whether the email domain is verified), and click **Add**. If asked, tick "Turn on the Microsoft Graph email permission" and confirm.
   - Supabase uses `xms_edov` to reject unverified email addresses, which closes off account takeovers through Microsoft accounts with unverified emails.
5. Supabase → **Authentication → Sign In / Providers → Azure**: enable it.
   - **Application (client) ID**: from step 2
   - **Secret Value**: from step 3
   - **Azure Tenant URL**: **leave empty**. Empty means the "common" endpoint (personal + work/school accounts).
   - Click **Save**.

The app asks Microsoft for the `email` scope, so the email address comes back with the sign-in.

**About "Need admin approval":** some schools and companies block new apps until an IT admin approves them. If someone sees that screen and goes back, `/login` shows a friendly message suggesting Google or email instead. Over time, [publisher verification](https://learn.microsoft.com/entra/identity-platform/publisher-verification-overview) (needs a Microsoft Partner Network account) makes Nudge look more trustworthy on these screens, but each organization still decides.

## 7. Run it ⬜ To do

```bash
npm install
npm run dev
```

Open http://localhost:3000/login.

## 8. Check that everything works ⬜ To do

Tip: after you sign up, Claude Code (connected to Supabase in this project) can check your saved rows and run the RLS check for you. Just ask.

- [ ] **Email**: Create account → confirm the email → you land on onboarding step 1.
- [ ] **Google**: Continue with Google → onboarding (your first name is already filled in, so step 1 doesn't ask for it).
- [ ] **Microsoft, personal**: Sign in with Microsoft using an Outlook.com account.
- [ ] **Microsoft, work/school**: same with a school account. If you get "Need admin approval", go back and check the message on `/login`.
- [ ] **Resume**: on step 2, refresh the page. You stay on step 2 with your step 1 answers kept.
- [ ] **Finish**: on step 3 add a few jobs (mark one "Applied last week"), press "Add N applications". You land on Today and that job shows "Needs a nudge".
- [ ] **Returning user**: log out and back in. You skip onboarding.
- [ ] **Data**: Supabase → Table Editor shows your answers in `profiles` and the jobs in `applications`.

### Verify Row Level Security

1. Create two accounts (for example, one with Google and one with email) and add at least one application with each.
2. Open [`supabase/verify_rls.sql`](supabase/verify_rls.sql) and paste it into the SQL Editor.
3. Run step 1 to list users. Copy user A's id into step 2 and run it. You should see **only user A's** rows, and the `update` should report **0 rows**.
4. Step 3 (signed-out role) should fail with **permission denied**.

Everything runs inside a transaction that is rolled back, so nothing changes.

## Deploying later (checklist)

- Add the same two env vars in your host (e.g. Vercel → Settings → Environment Variables).
- Supabase: change **Site URL** to the production URL. Keep both localhost and production in **Redirect URLs**.
- Google: add the production URL to **Authorized JavaScript origins**. The redirect URI (Supabase callback) stays the same.
- Microsoft: nothing changes (the redirect URI is the Supabase callback).
- Set up custom SMTP so confirmation emails reach real users.
