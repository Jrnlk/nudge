import { AppNav } from "@/components/AppNav";
import { FormDialog } from "@/components/FormDialog";
import { StoreProvider } from "@/lib/store";

/**
 * Shell for every signed-in screen.
 * TODO(auth): redirect to /login here when there is no session, and load the
 * user's data on the server instead of using the demo store.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AppNav />
      <main className="mx-auto max-w-[1080px] px-5 pb-20 pt-7">{children}</main>
      <FormDialog />
    </StoreProvider>
  );
}
