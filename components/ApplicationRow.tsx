"use client";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { fmtShort } from "@/lib/dates";
import { SETTABLE, bucketOf, followUpDate, isDue, statusColor } from "@/lib/services/applications";
import { useStore } from "@/lib/store";
import type { Application } from "@/lib/types";

/** Status label that opens a menu on hover or focus: change status, or delete with two clicks. */
function StatusChip({ app }: { app: Application }) {
  const { setStatus, remove } = useStore();
  const [armed, setArmed] = useState(false);
  const bucket = bucketOf(app);
  return (
    <div className="group relative self-start justify-self-end" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="chip flex items-center gap-1.5"
        data-nudge={bucket === "Needs a nudge"}
        style={{ "--c": statusColor(bucket) } as React.CSSProperties}
      >
        {bucket}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <div className="absolute right-0 top-full z-10 hidden min-w-[190px] pt-1.5 group-focus-within:block group-hover:block">
        <div className="rounded-tile border border-line bg-surface py-1.5 shadow-xl">
          {SETTABLE.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-current={s.key === app.status}
              onClick={() => {
                setStatus(app.id, s.key as Application["status"]);
                (document.activeElement as HTMLElement | null)?.blur();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-soft aria-[current=true]:font-extrabold"
            >
              <i className="size-[9px] rounded-full" style={{ background: s.color }} />
              {s.key}
            </button>
          ))}
          <hr className="my-1 border-line" />
          <button
            type="button"
            onClick={() => (armed ? remove("apps", app.id) : setArmed(true))}
            className="w-full px-3 py-2 text-left text-sm font-bold text-st-rejected hover:bg-soft"
          >
            {armed ? "Click again to delete" : "Delete application"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApplicationRow({ app }: { app: Application }) {
  const { openEditor } = useStore();
  const f = followUpDate(app);
  return (
    <div
      onClick={() => openEditor("apps", app.id)}
      className={`grid cursor-pointer grid-cols-[42px_1fr_auto] gap-x-3.5 gap-y-0.5 rounded-tile border border-line bg-surface px-4 py-3.5 hover:border-muted ${
        isDue(app) ? "shadow-[inset_4px_0_0_var(--s-follow)]" : ""
      }`}
    >
      <Avatar name={app.company} />
      <div>
        <h3 className="text-base font-extrabold leading-snug">
          <button type="button" onClick={() => openEditor("apps", app.id)} className="text-left">
            {app.company}
          </button>
        </h3>
        <div>{app.role}</div>
      </div>
      <StatusChip app={app} />
      <div className="col-[2/-1] flex flex-wrap gap-x-3.5 text-[13px] text-muted">
        {app.location && <span>{app.location}</span>}
        {app.dateApplied && <span>Applied {fmtShort(app.dateApplied)}</span>}
        {f && <span>Nudge on {fmtShort(f)}</span>}
      </div>
      {app.notes && <p className="col-[2/-1] text-[13px] text-muted">{app.notes}</p>}
    </div>
  );
}
