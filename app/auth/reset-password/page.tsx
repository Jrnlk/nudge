import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New password · Nudge" };

/** Reached from the reset email, which signs the person in for this one step. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?notice=link_expired");

  return (
    <div className="min-h-dvh px-5 py-6">
      <Logo />
      <main className="mx-auto mt-[12vh] w-[min(400px,100%)]">
        <h1 className="mb-1 text-[28px] font-extrabold">Choose a new password</h1>
        <p className="mb-6 text-muted">For {data.user.email}</p>
        <ResetPasswordForm />
      </main>
    </div>
  );
}
