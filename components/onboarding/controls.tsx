"use client";
import { forwardRef, useState } from "react";

/** Heading block shared by every step. The h2 receives focus when its step slides in. */
export const StepHeader = forwardRef<HTMLHeadingElement, { step: number; title: string; sub: string }>(
  function StepHeader({ step, title, sub }, ref) {
    return (
      <div className="mb-7">
        <p className="mb-1.5 text-[13px] font-bold text-muted">Step {step} of 3</p>
        <h2 ref={ref} tabIndex={-1} className="text-[clamp(26px,6vw,32px)] font-extrabold leading-tight outline-none">
          {title}
        </h2>
        <p className="mt-2 max-w-[34em] text-muted">{sub}</p>
      </div>
    );
  },
);

export function Legend({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <legend className="mb-2.5 text-[14.5px] font-bold">
      {children}
      {optional && <span className="ml-1.5 text-[13px] font-semibold text-muted">Optional</span>}
    </legend>
  );
}

/** Pill toggle. Pressed chips are navy, the rest are outlined. */
export function Chip({
  pressed,
  onClick,
  children,
  ...rest
}: { pressed: boolean; onClick: () => void; children: React.ReactNode } & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
>) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-full px-4 text-[14px] font-bold transition-colors ${
        pressed
          ? "bg-primary text-primary-ink"
          : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:bg-soft"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Chips for a list of options. `multiple` lets several be pressed; otherwise
 * pressing the selected chip again clears it (every question is optional).
 */
export function ChipGroup<T extends string>({
  legend,
  optional,
  options,
  value,
  onChange,
}: {
  legend: string;
  optional?: boolean;
  options: readonly { value: T; label: string }[];
  value: T | null | T[];
  onChange: (next: T | null | T[]) => void;
}) {
  const multiple = Array.isArray(value);
  const isOn = (v: T) => (multiple ? (value as T[]).includes(v) : value === v);
  const toggle = (v: T) => {
    if (multiple) {
      const list = value as T[];
      onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    } else onChange(value === v ? null : v);
  };
  return (
    <fieldset className="mb-7">
      <Legend optional={optional}>{legend}</Legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} pressed={isOn(o.value)} onClick={() => toggle(o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

/** Up to `max` tags, added with Enter or a comma, removable. Pending text is added on blur. */
export function TagInput({
  id,
  values,
  onChange,
  max,
  placeholder,
}: {
  id: string;
  values: string[];
  onChange: (v: string[]) => void;
  max: number;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const full = values.length >= max;

  const commit = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 80));
    }
    onChange(next);
    setDraft("");
  };

  return (
    <div className="input flex min-h-12 flex-wrap items-center gap-1.5 py-1.5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-focus">
      <ul className="contents" aria-label="Roles added">
        {values.map((v) => (
          <li key={v} className="flex items-center gap-1 rounded-full bg-soft py-1 pl-3 pr-1 text-[13.5px] font-bold">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
              className="grid size-7 place-items-center rounded-full text-muted hover:bg-line hover:text-ink"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>
      <input
        id={id}
        value={draft}
        disabled={full}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) commit(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={full ? "That's 3, the most you can add" : values.length ? "Add another" : placeholder}
        aria-describedby={`${id}-hint`}
        className="min-h-9 min-w-[10ch] flex-1 bg-transparent px-1 outline-none disabled:cursor-default"
      />
      <span id={`${id}-hint`} className="sr-only">
        Press Enter or type a comma to add a role. Up to {max}.
      </span>
    </div>
  );
}
