import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { isLoginNotice } from "@/lib/auth-messages";
import { destinationFor } from "@/lib/routing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in · Nudge" };

// Google's sign-in button guidelines ask for Roboto Medium.
const roboto = Roboto({ subsets: ["latin"], weight: "500", display: "swap" });

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(await destinationFor(supabase, data.user.id));

  const params = await searchParams;
  const notice = isLoginNotice(params.notice) ? params.notice : null;
  const mode = params.mode === "signup" ? "signup" : "login";

  return <LoginScreen initialMode={mode} initialNotice={notice} googleFontClass={roboto.className} />;
}
