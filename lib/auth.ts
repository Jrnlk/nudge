/*
  TODO: auth. Use Supabase Auth or Auth.js. Do not hand-roll passwords. Include Google sign-in.

  Export something like:
    getUser(): Promise<{ id: string; email: string; name: string } | null>
    requireUser(): returns the user or throws / redirects to /login

  Then:
    - call requireUser() in app/(app)/layout.tsx and in every route handler
    - swap the placeholder submit in components/AuthForm.tsx for real sign up / log in
    - replace `userName` in lib/store.tsx with the session's name
*/
export {};
