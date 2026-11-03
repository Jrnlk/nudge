"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { friendlyAuthError } from "@/lib/auth-messages";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Pick a password with at least 8 characters.");
    if (password !== confirm) return setError("Those two passwords don't match yet.");
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(friendlyAuthError(error));
    }
    // Full navigation on purpose: /auth/continue is a route handler that redirects.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/auth/continue");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-4 grid gap-1.5">
        <label htmlFor="new-password" className="text-[13px] font-bold">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" className="input min-h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="mb-4 grid gap-1.5">
        <label htmlFor="confirm-password" className="text-[13px] font-bold">Type it again</label>
        <input id="confirm-password" type="password" autoComplete="new-password" className="input min-h-11" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <p aria-live="polite" className="mb-3 min-h-5 text-[14px]">{error}</p>
      <Button type="submit" className="min-h-12 w-full" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
