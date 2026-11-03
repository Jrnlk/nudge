import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { FormDialog } from "@/components/FormDialog";
import { requireUser } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";

/**
 * Shell for every signed-in screen.
 * proxy.ts already sends signed-out visitors to /login; this also checks the
 * session against Supabase and sends anyone mid-onboarding back to it.
 * Search, People, and Ask still read the demo store (lib/store.tsx).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const name = profile.first_name || user.email?.split("@")[0] || "";

  return (
    <StoreProvider>
      <AppNav name={name} />
      <main className="mx-auto max-w-[1080px] px-5 pb-20 pt-7">{children}</main>
      <FormDialog />
    </StoreProvider>
  );
}
