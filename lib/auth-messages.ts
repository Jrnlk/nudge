/**
 * Friendly wording for auth problems. Raw codes from Supabase or the identity
 * provider are never shown to people.
 */

export type LoginNotice =
  | "cancelled"
  | "microsoft_blocked"
  | "oauth_failed"
  | "link_expired"
  | "password_updated"
  | "signed_out";

export const LOGIN_NOTICES: Record<LoginNotice, { text: string; tone: "info" | "warn" }> = {
  cancelled: { text: "Sign-in was cancelled. No problem, you can try again whenever you're ready.", tone: "info" },
  microsoft_blocked: {
    text: "Microsoft didn't finish signing you in. Some school and work accounts need an administrator's approval for new apps. Continuing with Google or with your email works just as well.",
    tone: "warn",
  },
  oauth_failed: { text: "We couldn't finish signing you in. Please try again, or use another option below.", tone: "warn" },
  link_expired: { text: "That link has expired or was already used. Request a new one below.", tone: "warn" },
  password_updated: { text: "Your password is updated. You're all set.", tone: "info" },
  signed_out: { text: "You're signed out. See you soon.", tone: "info" },
};

export const isLoginNotice = (v: unknown): v is LoginNotice =>
  typeof v === "string" && v in LOGIN_NOTICES;

/**
 * Map an OAuth error that came back to /auth/callback to a notice.
 * Microsoft sends AADSTS codes in error_description, for example:
 *  - AADSTS65001 / AADSTS90094 / AADSTS900941: admin consent required
 *  - AADSTS65004: the person declined consent ("Return to the application without consenting")
 */
export function noticeForOAuthError(
  provider: string | null,
  error: string | null,
  description: string | null,
): LoginNotice {
  const text = `${error ?? ""} ${description ?? ""}`;
  if (provider === "azure") {
    if (/AADSTS(65001|65004|90094|900941)|admin|consent|access_denied/i.test(text)) return "microsoft_blocked";
  }
  if (/access_denied|cancel/i.test(text)) return "cancelled";
  return "oauth_failed";
}

/** Map a Supabase AuthError (by code, then status) to a sentence. */
export function friendlyAuthError(err: { code?: string; status?: number; message?: string } | null): string {
  switch (err?.code) {
    case "invalid_credentials":
      return "That email and password don't match. Try again, or reset your password.";
    case "user_already_exists":
    case "email_exists":
      return "There's already an account with this email. Try logging in instead.";
    case "weak_password":
      return "Pick a stronger password, at least 8 characters.";
    case "email_not_confirmed":
      return "Please confirm your email first. The link is in your inbox.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "That's a lot of tries in a short time. Wait a minute, then try again.";
    case "same_password":
      return "That's your current password. Pick a new one.";
    case "validation_failed":
    case "email_address_invalid":
      return "Enter a valid email address.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Email sign-up isn't available right now. Try Google or Microsoft.";
  }
  if (err?.status === 429) return "That's a lot of tries in a short time. Wait a minute, then try again.";
  return "Something went wrong on our side. Please try again.";
}
