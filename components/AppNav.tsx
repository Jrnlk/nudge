"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { isDue } from "@/lib/services/applications";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/today", label: "Today" },
  { href: "/search", label: "Job search" },
  { href: "/people", label: "People" },
  { href: "/career", label: "Career" },
  { href: "/ask", label: "Ask Nudge" },
];

export function AppNav({ name }: { name: string }) {
  const path = usePathname();
  const { apps } = useStore();
  const due = apps.filter(isDue).length;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-4 px-5 py-2.5">
        <Logo href="/today" />
        <nav aria-label="Main" className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:mx-auto md:w-auto">
          {LINKS.map((l) => {
            const current = path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-[14.5px] font-bold no-underline ${
                  current ? "bg-ink text-paper" : "text-muted hover:bg-soft hover:text-ink"
                }`}
              >
                {l.label}
                {l.href === "/search" && due > 0 && (
                  <span className="rounded-[9px] bg-brand px-[7px] text-xs font-extrabold leading-[18px] text-brand-ink">{due}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <span aria-hidden="true" className="ml-auto grid size-[34px] place-items-center rounded-full bg-brand font-extrabold text-brand-ink md:ml-0">
          {name.charAt(0).toUpperCase()}
        </span>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="link" size="sm" className="min-h-11">Log out</Button>
        </form>
      </div>
    </header>
  );
}
