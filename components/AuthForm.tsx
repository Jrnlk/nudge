"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/**
 * Shared sign up / log in screen. Submitting only validates and routes to /today.
 * TODO(auth): replace `onSubmit` and the Google button with real calls (see lib/auth.ts).
 */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const signup = mode === "signup";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!/^\S+@\S+\.\S+$/.test(String(f.get("email")).trim())) return setError("Enter a valid email address.");
    if (String(f.get("password")).length < 8) return setError("Passwords need at least 8 characters.");
    setError("");
    router.push("/today");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between gap-6 bg-hero p-10 md:flex">
        <Logo />
        <blockquote className="m-0 max-w-[14em] text-[clamp(24px,3vw,34px)] font-extrabold leading-tight">
          {signup ? "Everything for your job search and career, without the noise." : "Welcome back. Here is what needs you today."}
        </blockquote>
        <small className="text-[13px] text-muted">Free while in preview.</small>
      </div>
      <div className="grid place-items-center px-5 py-10">
        <form onSubmit={onSubmit} noValidate className="w-[min(400px,100%)]">
          <h1 className="mb-1.5 text-3xl font-extrabold">{signup ? "Create your account" : "Log in"}</h1>
          <p className="mb-5 text-muted">{signup ? "Everything for your job search and career, in one calm place." : "Pick up where you left off."}</p>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/today")}>Continue with Google</Button>
          <div className="my-4 flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or</div>
          {signup && <Field id="name" label="Name" autoComplete="name" />}
          <Field id="email" label="Email" type="email" autoComplete="email" />
          <Field id="password" label="Password" type="password" autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "At least 8 characters" : undefined} />
          <p className="-mt-1.5 mb-3 min-h-4 text-[13px] text-st-rejected" aria-live="polite">{error}</p>
          <Button type="submit" className="w-full">{signup ? "Create account" : "Log in"}</Button>
          <p className="mt-4 text-center text-sm text-muted">
            {signup ? "Already have an account? " : "New to Nudge? "}
            <Link href={signup ? "/login" : "/signup"} className="font-bold text-ink">{signup ? "Log in" : "Create an account"}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, ...rest }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-3.5 grid gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold">{label}</label>
      <input id={id} name={id} className="input" {...rest} />
    </div>
  );
}
