import { redirect } from "next/navigation";

/** Sign-up lives on /login now (one page, with a toggle). */
export default function SignupPage() {
  redirect("/login?mode=signup");
}
