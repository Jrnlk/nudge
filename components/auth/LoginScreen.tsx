"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoogleButton, MicrosoftButton } from "@/components/auth/ProviderButtons";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { friendlyAuthError, LOGIN_NOTICES, type LoginNotice } from "@/lib/auth-messages";
import { createClient } from "@/lib/supabase/client";

type Mode = "signup" | "login" | "forgot";
type Provider = "google" | "azure";

/** Remembers that we left for Google/Microsoft, so coming back with the Back button can be explained. */
const PENDING_KEY = "nudge:oauth-pending";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Matches the minimum set in Supabase -> Authentication -> Providers -> Email (see SETUP.md). */
const MIN_PASSWORD = 8;

type FieldErrors = { password?: string; confirm?: string };

export function LoginScreen({
  initialMode,
  initialNotice,
  googleFontClass,
}: {
  initialMode: "signup" | "login";
  initialNotice: LoginNotice | null;
  googleFontClass: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [notice, setNotice] = useState<LoginNotice | null>(initialNotice);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [errorAction, setErrorAction] = useState<Mode | null>(null);
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState<Provider | "email" | null>(null);

  // Drop ?notice=... from the address bar so a refresh doesn't repeat it.
  useEffect(() => {
    if (initialNotice) window.history.replaceState(null, "", window.location.pathname);
  }, [initialNotice]);

  // Came back from Google/Microsoft without signing in (Back button, or Microsoft's
  // "Need admin approval" screen)? Explain gently instead of showing nothing.
  useEffect(() => {
    const check = (restoredFromCache: boolean) => {
      let pending: { provider: Provider; at: number } | null = null;
      try {
        pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null");
        sessionStorage.removeItem(PENDING_KEY);
      } catch {
        return;
      }
      setBusy(null);
      if (!pending || Date.now() - pending.at > 30 * 60_000) return;
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (restoredFromCache || nav?.type === "back_forward") {
        setNotice(pending.provider === "azure" ? "microsoft_blocked" : "cancelled");
      }
    };
    check(false);
    const onShow = (e: PageTransitionEvent) => e.persisted && check(true);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setConfirm("");
    setFieldErrors({});
    setError("");
    setErrorAction(null);
    setInfo("");
    setNotice(null);
  }

  async function signInWith(provider: Provider) {
    setError("");
    setNotice(null);
    setBusy(provider);
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ provider, at: Date.now() }));
    } catch {
      /* private mode: the friendly back-button message just won't show */
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?provider=${provider}`,
        // Microsoft only returns the email address when asked for it.
        scopes: provider === "azure" ? "email" : undefined,
      },
    });
    if (error) {
      setBusy(null);
      setError(friendlyAuthError(error));
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setErrorAction(null);
    setInfo("");
    setNotice(null);

    const cleanEmail = email.trim();
    if (!EMAIL_RE.test(cleanEmail)) return setError("Enter a valid email address.");

    if (mode === "forgot") {
      setBusy("email");
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      setBusy(null);
      if (error) return setError(friendlyAuthError(error));
      // Same message whether or not the account exists, so emails can't be probed.
      return setInfo(`If there's an account for ${cleanEmail}, a reset link is on its way. It can take a minute to arrive.`);
    }

    if (mode === "signup") {
      // Checked here first; Supabase is only called once both pass.
      const errs: FieldErrors = {};
      if (password.length < MIN_PASSWORD) errs.password = `Use at least ${MIN_PASSWORD} characters.`;
      if (!confirm) errs.confirm = "Type your password again to confirm it.";
      else if (confirm !== password) errs.confirm = "Passwords don't match.";
      if (errs.password || errs.confirm) {
        setFieldErrors(errs);
        document.getElementById(errs.password ? "password" : "confirm-password")?.focus();
        return;
      }
    }
    if (mode === "login" && !password) return setError("Enter your password.");

    setBusy("email");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
      });
      if (error) {
        setBusy(null);
        if (error.code === "user_already_exists" || error.code === "email_exists") setErrorAction("login");
        return setError(friendlyAuthError(error));
      }
      // With email confirmation on, Supabase hides existing accounts by returning a user with no identities.
      if (data.user && data.user.identities?.length === 0) {
        setBusy(null);
        setErrorAction("login");
        return setError(friendlyAuthError({ code: "user_already_exists" }));
      }
      if (data.session) {
        router.replace("/onboarding");
        return router.refresh();
      }
      // "Confirm email" is on (SETUP.md): no session until the link is opened.
      setBusy(null);
      setPassword("");
      setConfirm("");
      return setInfo(
        `Almost there. We sent a confirmation link to ${cleanEmail}. Open it in this browser to finish creating your account. If it isn't there in a few minutes, check your spam folder.`,
      );
    }

    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      setBusy(null);
      if (error.code === "invalid_credentials") setErrorAction("forgot");
      return setError(friendlyAuthError(error));
    }
    // Server decides: onboarding, Today, or Career.
    // Full navigation on purpose: /auth/continue is a route handler that redirects.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/auth/continue");
  }

  const heading = {
    signup: ["Create your account", "Takes a minute. Every setup step is optional."],
    login: ["Welcome back", "Pick up where you left off."],
    forgot: ["Reset your password", "We'll email you a link to choose a new one."],
  }[mode];

  const n = notice ? LOGIN_NOTICES[notice] : null;
  const anyBusy = busy !== null;

  return (
    <div className="flex min-h-dvh flex-col md:grid md:grid-cols-2">
      {/* Yellow panel: full height on desktop, a short header on phones. */}
      <div className="flex flex-col gap-3 bg-hero px-5 py-5 md:justify-between md:gap-6 md:p-10">
        <Logo />
        <p className="m-0 max-w-[16em] text-[19px] font-extrabold leading-snug md:text-[clamp(26px,3vw,36px)] md:leading-tight">
          Everything for your job search and career, without the noise.
        </p>
        <small className="hidden text-[13px] text-muted md:block">Free while in preview.</small>
      </div>

      <main className="flex flex-1 justify-center px-5 py-8 md:items-center md:py-10">
        <div className="w-[min(400px,100%)]">
          <h1 className="mb-1 text-[28px] font-extrabold">{heading[0]}</h1>
          <p className="mb-6 text-muted">{heading[1]}</p>

          {n && (
            <p
              role="status"
              className={`mb-5 rounded-tile px-4 py-3 text-[14px] ${n.tone === "warn" ? "bg-hero text-ink" : "bg-soft text-ink"}`}
            >
              {n.text}
            </p>
          )}

          {mode !== "forgot" && (
            <>
              <div className="grid gap-3">
                <GoogleButton
                  onClick={() => signInWith("google")}
                  busy={busy === "google"}
                  disabled={anyBusy}
                  fontClass={googleFontClass}
                />
                <MicrosoftButton onClick={() => signInWith("azure")} busy={busy === "azure"} disabled={anyBusy} />
              </div>
              <p className="mt-2 text-center text-[12.5px] text-muted">
                Microsoft works with Outlook.com and work or school accounts.
              </p>

              <div className="my-6 flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
                or
              </div>

              <div role="group" aria-label="Email options" className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-soft p-1">
                {(["signup", "login"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => switchMode(m)}
                    className={`min-h-11 rounded-full text-[14px] font-bold ${
                      mode === m ? "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]" : "text-muted"
                    }`}
                  >
                    {m === "signup" ? "Create account" : "Log in"}
                  </button>
                ))}
              </div>
            </>
          )}

          <form onSubmit={onSubmit} noValidate>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {mode !== "forgot" && (
              <Field
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? `At least ${MIN_PASSWORD} characters` : undefined}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                }}
                error={fieldErrors.password}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    aria-controls={mode === "signup" ? "password confirm-password" : "password"}
                    aria-label={mode === "signup" ? "Show passwords" : "Show password"}
                    className="absolute inset-y-0 right-0 my-auto mr-1 h-9 rounded-full px-3 text-[13px] font-bold text-muted hover:bg-soft hover:text-ink"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                }
                labelAside={
                  mode === "login" ? (
                    <button type="button" onClick={() => switchMode("forgot")} className="text-[13px] font-bold text-muted underline-offset-2 hover:text-ink hover:underline">
                      Forgot password?
                    </button>
                  ) : null
                }
              />
            )}
            {mode === "signup" && (
              <Field
                id="confirm-password"
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (fieldErrors.confirm) setFieldErrors((f) => ({ ...f, confirm: undefined }));
                }}
                error={fieldErrors.confirm}
              />
            )}

            <div aria-live="polite" className="min-h-5">
              {error && (
                <p className="mb-3 text-[14px] text-ink">
                  {error}{" "}
                  {errorAction && (
                    <button type="button" onClick={() => switchMode(errorAction)} className="font-bold underline underline-offset-2">
                      {errorAction === "login" ? "Log in" : "Reset password"}
                    </button>
                  )}
                </p>
              )}
              {info && <p className="mb-3 rounded-tile bg-soft px-4 py-3 text-[14px]">{info}</p>}
            </div>

            <Button type="submit" variant="ghost" className="min-h-12 w-full" disabled={anyBusy}>
              {busy === "email"
                ? "One moment…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "login"
                    ? "Log in"
                    : "Send reset link"}
            </Button>
          </form>

          {mode === "forgot" && (
            <p className="mt-5 text-center text-sm text-muted">
              Remembered it?{" "}
              <button type="button" onClick={() => switchMode("login")} className="font-bold text-ink">
                Back to log in
              </button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  labelAside,
  trailing,
  error,
  ...rest
}: {
  id: string;
  label: string;
  labelAside?: React.ReactNode;
  /** Shown inside the right edge of the input (the Show/Hide button). */
  trailing?: React.ReactNode;
  /** Inline error under the input. */
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4 grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-bold">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`input min-h-11 ${trailing ? "pr-[4.5rem]" : ""} ${error ? "border-st-rejected" : ""}`}
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-[13.5px] font-semibold text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
