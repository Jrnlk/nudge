"use client";
import { useState } from "react";
import { ApplicationRow } from "@/components/ApplicationRow";
import { StatusRing } from "@/components/charts/StatusRing";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHead, Tabs } from "@/components/ui/Card";
import { bucketOf, isDue, matchesQuery } from "@/lib/services/applications";
import { useStore } from "@/lib/store";
import type { Bucket } from "@/lib/types";

type Sub = "apps" | "companies" | "archived";
const PRIORITY_COLOR = { High: "var(--s-rejected)", Medium: "var(--s-follow)", Low: "var(--s-research)" } as const;

export default function SearchPage() {
  const { apps, appsStatus, reloadApps, notice, dismissNotice, companies, openEditor } = useStore();
  const [sub, setSub] = useState<Sub>("apps");
  const [filter, setFilter] = useState<Bucket | null>(null);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  // Target companies are still an in-memory placeholder; their search is unchanged.
  const match = (x: object) => !query || JSON.stringify(x).toLowerCase().includes(query);

  const onFilter = (b: Bucket) => {
    if (b === "Archived") { setSub("archived"); setFilter(null); }
    else { setSub("apps"); setFilter(filter === b ? null : b); }
  };

  const inTab = apps.filter((a) =>
    sub === "archived" ? a.status === "Archived" : filter ? bucketOf(a) === filter : a.status !== "Archived",
  );
  const items = inTab
    .filter((a) => matchesQuery(a, q))
    .sort((a, b) => Number(isDue(b)) - Number(isDue(a)));
  const ready = appsStatus === "ready";

  return (
    <>
      <PageHead
        title="Job search"
        subtitle="Every application in one place."
        action={
          <Button variant="brand" onClick={() => openEditor(sub === "companies" ? "companies" : "apps")} disabled={sub !== "companies" && !ready}>
            {sub === "companies" ? "Add company" : "Add application"}
          </Button>
        }
      />

      {notice && (
        <div role="status" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-tile bg-hero px-4 py-3 text-[14px]">
          <span className="flex-1">{notice.text}</span>
          {notice.retry && (
            <button type="button" onClick={notice.retry} className="min-h-9 font-bold underline underline-offset-2">
              Try again
            </button>
          )}
          <button type="button" onClick={dismissNotice} className="min-h-9 text-muted hover:text-ink" aria-label="Dismiss message">
            Dismiss
          </button>
        </div>
      )}

      {ready && <StatusRing apps={apps} filter={filter} onFilter={onFilter} />}

      <Tabs
        value={sub}
        onChange={(k) => { setSub(k); setFilter(null); }}
        tabs={[
          { key: "apps", label: "Applications" },
          { key: "companies", label: "Target companies" },
          { key: "archived", ariaLabel: "Archived applications", label: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><path d="M10 12h4" />
            </svg>
          ) },
        ]}
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder={sub === "companies" ? "Search companies" : "Search company, role, or notes"}
        aria-label={sub === "companies" ? "Search target companies" : "Search applications"}
        className="input mb-2.5"
      />

      <div className="grid gap-2" aria-busy={sub !== "companies" && appsStatus === "loading"}>
        {sub === "companies" ? (
          companies.filter(match).length ? companies.filter(match).map((c) => (
            <div key={c.id} onClick={() => openEditor("companies", c.id)} className="grid cursor-pointer grid-cols-[42px_1fr_auto] gap-x-3.5 gap-y-0.5 rounded-tile border border-line bg-surface px-4 py-3.5 hover:border-muted">
              <Avatar name={c.name} />
              <div><h3 className="text-base font-extrabold">{c.name}</h3><div>{c.category}</div></div>
              {c.priority ? <span className="chip self-start" style={{ "--c": PRIORITY_COLOR[c.priority] } as React.CSSProperties}>{c.priority} priority</span> : <span />}
              <div className="col-[2/-1] text-[13px] text-muted">{c.state}</div>
            </div>
          )) : (
            <EmptyState title="No dream companies yet" action={<Button variant="brand" size="sm" onClick={() => openEditor("companies")}>Add a company</Button>}>
              Add the places you would love to work, even if they are not hiring.
            </EmptyState>
          )
        ) : appsStatus === "loading" ? (
          <>
            <p className="sr-only" role="status">Loading your applications</p>
            {[0, 1, 2].map((i) => (
              <div key={i} aria-hidden="true" className="grid grid-cols-[42px_1fr] gap-x-3.5 rounded-tile border border-line bg-surface px-4 py-3.5 motion-safe:animate-pulse">
                <span className="size-[42px] rounded-full bg-soft" />
                <span className="grid content-center gap-2">
                  <span className="h-3.5 w-2/5 rounded bg-soft" />
                  <span className="h-3 w-3/5 rounded bg-soft" />
                </span>
              </div>
            ))}
          </>
        ) : appsStatus === "error" ? (
          <EmptyState title="Your applications are taking a moment" action={<Button size="sm" onClick={reloadApps}>Try again</Button>}>
            We couldn&apos;t load them just now. Nothing is lost, so try again in a moment.
          </EmptyState>
        ) : items.length ? (
          items.map((a) => <ApplicationRow key={a.id} app={a} />)
        ) : query && inTab.length ? (
          <EmptyState action={<Button variant="ghost" size="sm" onClick={() => setQ("")}>Clear search</Button>}>
            Nothing matches &ldquo;{q.trim()}&rdquo;.
          </EmptyState>
        ) : sub === "archived" ? (
          <EmptyState>Nothing archived yet. Applications you archive show up here.</EmptyState>
        ) : !apps.length ? (
          <EmptyState title="Your list is empty, for now" action={<Button variant="brand" size="sm" onClick={() => openEditor("apps")}>Add your first application</Button>}>
            Add your first application and Nudge will keep track of it.
          </EmptyState>
        ) : filter ? (
          <EmptyState action={<Button variant="ghost" size="sm" onClick={() => setFilter(null)}>Show all</Button>}>
            Nothing in {filter} right now.
          </EmptyState>
        ) : (
          <EmptyState action={<Button variant="brand" size="sm" onClick={() => openEditor("apps")}>Add an application</Button>}>
            Everything here is archived. Add a new application when you&apos;re ready.
          </EmptyState>
        )}
      </div>
    </>
  );
}
