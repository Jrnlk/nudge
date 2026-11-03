import Link from "next/link";

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#FFC83D" />
      <path d="M10 23.5V14a5.5 5.5 0 0 1 11 0v9.5" fill="none" stroke="#191B2A" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M25.5 7.5l2-2M26.8 11l2.4-.6" stroke="#191B2A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** The app name lives here only, so renaming the product is a one-line change. */
export const APP_NAME = "nudge";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-[21px] font-extrabold tracking-tight text-ink no-underline">
      <LogoMark />
      {APP_NAME}
    </Link>
  );
}
