/**
 * Public Supabase settings. Both values are safe in the browser: the anon /
 * publishable key only grants what Row Level Security allows.
 * Never put the service role (secret) key in a NEXT_PUBLIC_ variable.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in (see SETUP.md).",
    );
  }
  return { url, key };
}
