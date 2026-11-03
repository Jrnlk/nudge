"use client";
import { useState } from "react";
import { NetworkWeb } from "@/components/charts/NetworkWeb";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHead, Tabs } from "@/components/ui/Card";
import { useStore } from "@/lib/store";

export default function PeoplePage() {
  const { people, openEditor } = useStore();
  const [view, setView] = useState<"web" | "list">("web");

  return (
    <>
      <PageHead
        title="People"
        subtitle="Recruiters, referrals, and friends helping your search."
        action={<Button variant="brand" onClick={() => openEditor("people")}>Add person</Button>}
      />
      <Tabs value={view} onChange={setView} tabs={[{ key: "web", label: "Network" }, { key: "list", label: "List" }]} />
      {view === "web" && <div className="mb-4 rounded-card bg-soft p-4"><NetworkWeb /></div>}
      {(view === "list" || !people.length) && (
        <div className="grid gap-2">
          {people.length ? people.map((p) => (
            <div key={p.id} onClick={() => openEditor("people", p.id)} className="grid cursor-pointer grid-cols-[42px_1fr_auto] gap-x-3.5 gap-y-0.5 rounded-tile border border-line bg-surface px-4 py-3.5 hover:border-muted">
              <Avatar name={p.name} />
              <div><h3 className="text-base font-extrabold">{p.name}</h3><div>{p.relationship}</div></div>
              <span />
              <div className="col-[2/-1] flex flex-wrap gap-x-3.5 text-[13px] text-muted">
                {p.org && <span>{p.org}</span>}
                {p.nextStep && <span>Next: {p.nextStep}</span>}
              </div>
            </div>
          )) : (
            <EmptyState title="No one here yet" action={<Button variant="brand" size="sm" onClick={() => openEditor("people")}>Add a person</Button>}>
              Add recruiters, referrals, and alumni so you never lose track of who is helping.
            </EmptyState>
          )}
        </div>
      )}
    </>
  );
}
