"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { fmtShort } from "@/lib/dates";
import { SETTABLE, bucketOf, followUpDate, isDue, statusColor } from "@/lib/services/applications";
import { useStore } from "@/lib/store";
import type { Application, Status } from "@/lib/types";

/**
 * Status chip that opens a menu (tap, click, Enter, or Space): change status,
 * or delete with two clicks. Esc and clicking outside close it.
 */
function StatusChip({ app }: { app: Application }) {
  const { setStatus, removeApp } = useStore();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const bucket = bucketOf(app);

  const close = (refocus = true) => {
    setOpen(false);
    setArmed(false);
    if (refocus) trigger.current?.focus();
  };

  // Close on a click or tap anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setOpen(false);
        setArmed(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Move focus into the menu when it opens, onto the current status.
  useEffect(() => {
    if (!open) return;
    const items = menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]");
    const current = menu.current?.querySelector<HTMLButtonElement>("[aria-checked=true]");
    (current ?? items?.[0])?.focus();
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem], [role=menuitemradio]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(i + step + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  async function onDelete() {
    if (!armed) return setArmed(true);
    setDeleting(true);
    const ok = await removeApp(app.id);
    setDeleting(false);
    if (!ok) close();
  }

  return (
    <div ref={wrap} className="relative self-start justify-self-end" onClick={(e) => e.stopPropagation()}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Status: ${bucket}. Change status or delete ${app.company}`}
        onClick={() => (open ? close() : setOpen(true))}
        className="chip flex min-h-8 items-center gap-1.5"
        data-nudge={bucket === "Needs a nudge"}
        style={{ "--c": statusColor(bucket) } as React.CSSProperties}
      >
        {bucket}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          ref={menu}
          id={menuId}
          role="menu"
          aria-label={`Status for ${app.company}`}
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-20 mt-1.5 min-w-[200px] rounded-tile border border-line bg-surface py-1.5 shadow-xl"
        >
          {SETTABLE.map((s) => (
            <button
              key={s.key}
              type="button"
              role="menuitemradio"
              aria-checked={s.key === app.status}
              tabIndex={-1}
              onClick={() => {
                setStatus(app.id, s.key as Status);
                close();
              }}
              className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-sm hover:bg-soft focus-visible:bg-soft aria-checked:font-extrabold"
            >
              <i className="size-[9px] rounded-full" style={{ background: s.color }} aria-hidden="true" />
              {s.key}
            </button>
          ))}
          <hr className="my-1 border-line" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={deleting}
            onClick={onDelete}
            className="min-h-10 w-full px-3 text-left text-sm font-bold text-st-rejected hover:bg-soft focus-visible:bg-soft disabled:opacity-60"
          >
            {deleting ? "Deleting…" : armed ? "Click again to delete" : "Delete application"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ApplicationRow({ app }: { app: Application }) {
  const { openEditor } = useStore();
  const f = followUpDate(app);
  return (
    <div
      onClick={() => openEditor("apps", app.id)}
      className={`grid cursor-pointer grid-cols-[42px_minmax(0,1fr)_auto] gap-x-3.5 gap-y-0.5 rounded-tile border border-line bg-surface px-4 py-3.5 hover:border-muted ${
        isDue(app) ? "shadow-[inset_4px_0_0_var(--s-follow)]" : ""
      }`}
    >
      <Avatar name={app.company} />
      <div className="min-w-0">
        <h3 className="text-base font-extrabold leading-snug">
          <button type="button" onClick={() => openEditor("apps", app.id)} className="break-words text-left">
            {app.company}
          </button>
        </h3>
        {app.role && <div className="break-words">{app.role}</div>}
      </div>
      <StatusChip app={app} />
      <div className="col-[2/-1] flex flex-wrap gap-x-3.5 text-[13px] text-muted">
        {app.location && <span>{app.location}</span>}
        {app.dateApplied && <span>Applied {fmtShort(app.dateApplied)}</span>}
        {f && <span>Nudge on {fmtShort(f)}</span>}
      </div>
      {app.notes && <p className="col-[2/-1] line-clamp-2 break-words text-[13px] text-muted">{app.notes}</p>}
    </div>
  );
}
