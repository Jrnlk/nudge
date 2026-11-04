"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toISO } from "@/lib/dates";
import {
  LIMITS,
  SETTABLE,
  toInput,
  validateApplication,
  type ApplicationInput,
  type FieldErrors,
} from "@/lib/services/applications";
import type { Prefill } from "@/lib/services/prefill";
import { useStore } from "@/lib/store";

type Key = keyof ApplicationInput;

const FIELDS: { key: Key; label: string; type: "text" | "url" | "date" | "textarea" | "select"; full?: boolean; hint?: string; max?: number; required?: boolean }[] = [
  { key: "link", label: "Job posting link", type: "url", full: true },
  { key: "company", label: "Company", type: "text", required: true, max: LIMITS.company },
  { key: "role", label: "Role", type: "text", max: LIMITS.role },
  { key: "location", label: "Location", type: "text", max: LIMITS.location },
  { key: "status", label: "Status", type: "select" },
  { key: "dateApplied", label: "Date applied", type: "date" },
  { key: "source", label: "Source", type: "text", max: LIMITS.source, hint: "For example, Company site or Referral" },
  { key: "notes", label: "Notes", type: "textarea", full: true, max: LIMITS.notes },
];

/** Add or edit one application. Input stays put if a save fails, so nothing is lost. */
export function ApplicationForm({ id }: { id?: string }) {
  const { apps, saveApp, removeApp, closeEditor, dismissNotice } = useStore();
  const existing = id ? apps.find((a) => a.id === id) : undefined;
  const [values, setValues] = useState<ApplicationInput>(() => toInput(existing));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [armed, setArmed] = useState(false);
  const [fillNote, setFillNote] = useState("");
  /** After Fill in, the company came from a slug or subdomain, so words may run together. */
  const [checkCompany, setCheckCompany] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: Key, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (k === "company") setCheckCompany(false); // they've looked at it
  };

  const focusFirstError = (e: FieldErrors) => {
    const first = FIELDS.find((f) => e[f.key]);
    if (first) (formRef.current?.elements.namedItem(first.key) as HTMLElement | null)?.focus();
  };

  // Reads what it can from the link's text (the server never fetches the page).
  async function fill() {
    const link = values.link.trim();
    if (!link) return;
    const companyWasEmpty = !values.company.trim();
    setFillNote("");
    setCheckCompany(false);
    try {
      const res = await fetch("/api/prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const body = (await res.json()) as Prefill & { error?: string };
      if (!res.ok) return setFillNote(body.error ?? "Could not read that link.");
      setValues((s) => ({
        ...s,
        company: s.company || body.company || "",
        role: s.role || body.role || "",
        location: s.location || body.location || "",
      }));
      // Only when we actually filled the company in, including when the role was found too.
      setCheckCompany(companyWasEmpty && !!body.company && !!body.companyUncertain);
      if (!body.company) setFillNote("That link has no details in it. Fill in the rest by hand.");
      else if (!body.role) setFillNote("Got the company. Check the spelling, then add the role.");
    } catch {
      setFillNote("Could not reach the server. Fill in the details by hand.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    const checked = validateApplication(values, toISO(new Date()));
    if (!checked.ok) {
      setErrors(checked.errors);
      return focusFirstError(checked.errors);
    }
    setBusy("save");
    const res = await saveApp(id, values);
    setBusy(null);
    if (res.ok) return closeEditor();
    if (res.fieldErrors) {
      setErrors(res.fieldErrors);
      focusFirstError(res.fieldErrors);
    }
    setFormError(res.error);
  }

  async function onDelete() {
    if (!id) return;
    if (!armed) return setArmed(true);
    setBusy("delete");
    const ok = await removeApp(id);
    setBusy(null);
    if (ok) closeEditor();
    else {
      dismissNotice(); // shown here instead, next to the button
      setArmed(false);
      setFormError("We couldn't delete that just now. Try again in a moment.");
    }
  }

  if (id && !existing) {
    return (
      <div className="grid gap-4 p-6">
        <h2 className="text-[22px] font-extrabold">This application isn&apos;t here anymore</h2>
        <p className="text-muted">It may have been deleted in another tab.</p>
        <div className="flex justify-end">
          <Button onClick={closeEditor}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="p-5 sm:p-6">
      <h2 className="mb-4 text-[22px] font-extrabold">{id ? "Edit application" : "Add application"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const err = errors[f.key];
          const fid = `app_${f.key}`;
          const showCheck = f.key === "company" && checkCompany && !err;
          const describedBy =
            [err ? `${fid}_err` : null, f.hint ? `${fid}_hint` : null, showCheck ? `${fid}_check` : null]
              .filter(Boolean)
              .join(" ") || undefined;
          const common = {
            id: fid,
            name: f.key,
            value: values[f.key],
            "aria-invalid": err ? true : undefined,
            "aria-describedby": describedBy,
            className: `input ${err ? "border-st-rejected" : ""}`,
          };
          return (
            <div key={f.key} className={`grid content-start gap-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
              <label htmlFor={fid} className="text-[13px] font-bold">
                {f.label}
                {f.required && <span className="ml-1 font-semibold text-muted">(required)</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea {...common} maxLength={f.max} onChange={(e) => set(f.key, e.target.value)} />
              ) : f.type === "select" ? (
                <select {...common} onChange={(e) => set(f.key, e.target.value)}>
                  {SETTABLE.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.key}
                    </option>
                  ))}
                </select>
              ) : f.type === "url" ? (
                <div className="flex gap-2">
                  <input
                    {...common}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://…"
                    onChange={(e) => set(f.key, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                  <Button onClick={fill}>Fill in</Button>
                </div>
              ) : (
                <input
                  {...common}
                  type={f.type}
                  maxLength={f.max}
                  max={f.type === "date" ? toISO(new Date()) : undefined}
                  aria-required={f.required || undefined}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
              {f.hint && !err && (
                <p id={`${fid}_hint`} className="text-[12.5px] text-muted">
                  {f.hint}
                </p>
              )}
              {showCheck && (
                <p id={`${fid}_check`} className="text-[12.5px] text-muted">
                  Read from the link. Check the spelling.
                </p>
              )}
              {f.key === "status" && !err && (
                <p className="text-[12.5px] text-muted">Archived is for jobs you&apos;ve moved on from. Rejected is for an actual no.</p>
              )}
              {err && (
                <p id={`${fid}_err`} className="text-[13px] font-semibold text-ink">
                  {err}
                </p>
              )}
              {f.type === "url" && fillNote && (
                <p className="text-[13px] text-muted" aria-live="polite">
                  {fillNote}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div aria-live="polite">
        {formError && (
          <p className="mt-4 rounded-tile bg-hero px-4 py-3 text-[14px]">
            {formError}
            {busy === null && !Object.values(errors).some(Boolean) && (
              <>
                {" "}
                <button type="submit" className="font-bold underline underline-offset-2">
                  Try again
                </button>
              </>
            )}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap-reverse justify-between gap-2.5">
        <div>
          {id && (
            <Button variant="ghost" className="text-st-rejected" onClick={onDelete} disabled={busy !== null}>
              {busy === "delete" ? "Deleting…" : armed ? "Click again to delete" : "Delete"}
            </Button>
          )}
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={closeEditor} disabled={busy === "delete"}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy !== null}>
            {busy === "save" ? "Saving…" : "Save application"}
          </Button>
        </div>
      </div>
    </form>
  );
}
