"use client";
import { useState } from "react";
import { ApplicationRow } from "@/components/ApplicationRow";
import { StatusRing } from "@/components/charts/StatusRing";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHead, Tabs } from "@/components/ui/Card";
import { bucketOf, isDue } from "@/lib/services/applications";
import { useStore } from "@/lib/store";
import type { Bucket } from "@/lib/types";

type Sub = "apps" | "companies" | "archived";
const PRIORITY_COLOR = { High: "var(--s-rejected)", Medium: "var(--s-follow)", Low: "var(--s-research)" } as const;

export default function SearchPage() {
  const { apps, companies, openEditor } = useStore();
  const [sub, setSub] = useState<Sub>("apps");
  const [filter, setFilter] = useState<Bucket | null>(null);
  const [q, setQ] = useState("");
  const query = q.toLowerCase();
  const match = (x: object) => !query || JSON.stringify(x).toLowerCase().includes(query);

  const onFilter = (b: Bucket) => {
    if (b === "Archived") { setSub("archived"); setFilter(null); }
    else { setSub("apps"); setFilter(filter === b ? null : b); }
  };

  const items = apps
    .filter(match)
    .filter((a) => (sub === "archived" ? a.status === "Archived" : filter ? bucketOf(a) === filter : a.status !== "Archived"))
    .sort((a, b) => Number(isDue(b)) - Number(isDue(a)));

  return (
    <>
      <PageHead
        title="Job search"
        subtitle="Every application in one place."
        action={<Button variant="brand" onClick={() => openEditor(sub === "companies" ? "companies" : "apps")}>{sub === "companies" ? "Add company" : "Add application"}</Button>}
      />
      <StatusRing apps={apps} filter={filter} onFilter={onFilter} />
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
      <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search company, role, or notes" aria-label="Search" className="input mb-2.5" />

      <div className="grid gap-2">
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
        ) : items.length ? (
          items.map((a) => <ApplicationRow key={a.id} app={a} />)
        ) : sub === "archived" ? (
          <EmptyState>Nothing archived yet.</EmptyState>
        ) : !apps.length ? (
          <EmptyState title="Your list is empty, for now" action={<Button variant="brand" size="sm" onClick={() => openEditor("apps")}>Add your first application</Button>}>
            Add your first application and Nudge will keep track of it.
          </EmptyState>
        ) : (
          <EmptyState>Nothing matches. Clear the search or filter.</EmptyState>
        )}
      </div>
    </>
  );
}
