"use client";
import { forwardRef, useRef, useState } from "react";
import { StepHeader } from "@/components/onboarding/controls";
import { Button } from "@/components/ui/Button";
import { ROW_STATUSES, WHEN, type DraftRow, type DraftStatus, type When } from "@/lib/onboarding";
import { parseJobUrl } from "@/lib/services/prefill";

type Tab = "links" | "hand";
const TABS: { key: Tab; label: string }[] = [
  { key: "links", label: "Paste links" },
  { key: "hand", label: "Add by hand" },
];

type Props = {
  settled: boolean;
  rows: DraftRow[];
  setRows: (update: (rows: DraftRow[]) => DraftRow[]) => void;
};

let keySeq = 0;
const newKey = () => `row-${Date.now().toString(36)}-${keySeq++}`;

const blankRow = (patch: Partial<DraftRow>): DraftRow => ({
  key: newKey(),
  company: "",
  role: "",
  location: "",
  postingUrl: "",
  source: "manual",
  status: "Applied",
  when: "this_week",
  parsed: false,
  ...patch,
});

/** Step 3: "Add the jobs you've already applied to" */
export const StepJobs = forwardRef<HTMLHeadingElement, Props>(function StepJobs({ settled, rows, setRows }, ref) {
  const [tab, setTab] = useState<Tab>("links");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ links: null, hand: null });

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.key === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].key;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <StepHeader
        ref={ref}
        step={3}
        title="Add the jobs you've already applied to"
        sub={
          settled
            ? "If you're not applying anywhere right now, skip this step."
            : "Your dashboard starts with your real search, and Nudge flags anything that's due for a follow-up."
        }
      />

      <div role="tablist" aria-label="Ways to add jobs" className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-soft p-1" onKeyDown={onTabKey}>
        {TABS.map((t) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[t.key] = el;
            }}
            id={`ob-tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            aria-controls={`ob-panel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            onClick={() => setTab(t.key)}
            className={`min-h-11 whitespace-nowrap rounded-full px-1 text-[13px] font-bold sm:px-2 sm:text-[14px] ${
              tab === t.key ? "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`ob-panel-${tab}`} role="tabpanel" aria-labelledby={`ob-tab-${tab}`} className="mb-8">
        {tab === "links" && <PasteLinks rows={rows} setRows={setRows} />}
        {tab === "hand" && <AddByHand setRows={setRows} />}
      </div>

      {rows.length > 0 && <ReadyList rows={rows} setRows={setRows} />}
    </>
  );
});

function PasteLinks({ rows, setRows }: Pick<Props, "rows" | "setRows">) {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  function read() {
    const lines = text.split(/\s+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return setResult("Paste at least one link first, one per line.");

    const known = new Set(rows.map((r) => r.postingUrl));
    const added: DraftRow[] = [];
    const notLinks: string[] = [];
    let duplicates = 0;

    for (const line of lines) {
      const raw = /^https?:\/\//i.test(line) ? line : `https://${line}`;
      try {
        const href = new URL(raw).toString();
        if (known.has(href)) {
          duplicates++;
          continue;
        }
        const p = parseJobUrl(raw);
        known.add(href);
        added.push(
          blankRow({
            company: p.company ?? "",
            role: p.role ?? "",
            location: p.location ?? "",
            postingUrl: href,
            source: "link",
            parsed: !!p.company && !!p.companyUncertain,
          }),
        );
      } catch {
        notLinks.push(line);
      }
    }

    if (added.length) setRows((r) => [...r, ...added]);
    setText(notLinks.join("\n"));

    const missing = added.filter((r) => !r.company).length;
    const parts: string[] = [];
    if (added.length) parts.push(`Added ${added.length} link${added.length === 1 ? "" : "s"}.`);
    if (missing)
      parts.push(
        `${missing} need${missing === 1 ? "s" : ""} a company name, since some sites, like LinkedIn and Indeed, don't include it in the link.`,
      );
    if (duplicates) parts.push(`${duplicates} ${duplicates === 1 ? "was" : "were"} already in your list.`);
    if (notLinks.length)
      parts.push(`${notLinks.length} line${notLinks.length === 1 ? " doesn't" : "s don't"} look like a link, so ${notLinks.length === 1 ? "it's" : "they're"} still in the box.`);
    setResult(parts.join(" "));
  }

  return (
    <div className="grid gap-3">
      <label htmlFor="ob-links" className="text-[14.5px]">
        Paste job posting links, one per line. Nudge fills in what it can from each link.
      </label>
      <textarea
        id="ob-links"
        className="input min-h-28"
        placeholder="https://company.wd5.myworkdayjobs.com/…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div>
        <Button onClick={read} className="min-h-11">
          Read links
        </Button>
      </div>
      <p aria-live="polite" className="text-[14px] text-muted">
        {result}
      </p>
    </div>
  );
}

function AddByHand({ setRows }: Pick<Props, "setRows">) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [msg, setMsg] = useState("");
  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);

  function add() {
    const c = company.trim();
    const r = role.trim();
    if (!c && !r) {
      setMsg("Type a company to add a job.");
      return companyRef.current?.focus();
    }
    setRows((rows) => [...rows, blankRow({ company: c, role: r })]);
    setCompany("");
    setRole("");
    setMsg(`Added ${c || r}.`);
    companyRef.current?.focus();
  }

  return (
    <div className="grid gap-3">
      <p className="text-[14.5px]">Add a company and role. You can fill in the details later.</p>
      <div className="flex flex-wrap gap-2">
        <input
          ref={companyRef}
          aria-label="Company"
          placeholder="Company"
          className="input min-h-12 min-w-0 flex-[1_1_160px]"
          value={company}
          maxLength={200}
          onChange={(e) => setCompany(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              roleRef.current?.focus();
            }
          }}
        />
        <input
          ref={roleRef}
          aria-label="Role"
          placeholder="Role"
          className="input min-h-12 min-w-0 flex-[1_1_160px]"
          value={role}
          maxLength={200}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button onClick={add} className="min-h-12 px-6">
          Add
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {msg}
      </p>
    </div>
  );
}

function ReadyList({ rows, setRows }: Pick<Props, "rows" | "setRows">) {
  const update = (key: string, patch: Partial<DraftRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  return (
    <section aria-labelledby="ob-ready">
      <h3 id="ob-ready" className="mb-3 text-[17px] font-extrabold">
        Ready to add
      </h3>
      <ul className="grid gap-3">
        {rows.map((r, i) => {
          const missing = !r.company.trim();
          const label = r.company.trim() || r.role.trim() || `job ${i + 1}`;
          return (
            <li key={r.key} className={`grid gap-2 rounded-tile p-3 ${missing ? "bg-hero" : "bg-soft"}`}>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  aria-label={`Company for ${label}`}
                  placeholder="Company"
                  className={`input min-h-11 ${missing ? "border-ink" : ""}`}
                  value={r.company}
                  maxLength={200}
                  onChange={(e) => update(r.key, { company: e.target.value, parsed: false })}
                />
                <input
                  aria-label={`Role for ${label}`}
                  placeholder="Role"
                  className="input min-h-11"
                  value={r.role}
                  maxLength={200}
                  onChange={(e) => update(r.key, { role: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Status for ${label}`}
                  className="input min-h-11 min-w-0 flex-[1_1_130px]"
                  value={r.status}
                  onChange={(e) => update(r.key, { status: e.target.value as DraftStatus })}
                >
                  {ROW_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {r.status !== "Researching" && (
                  <select
                    aria-label={`When you applied to ${label}`}
                    className="input min-h-11 min-w-0 flex-[1_1_150px]"
                    value={r.when}
                    onChange={(e) => update(r.key, { when: e.target.value as When })}
                  >
                    {WHEN.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => remove(r.key)}
                  aria-label={`Remove ${label}`}
                  className="min-h-11 rounded-full px-3 text-[13.5px] font-bold text-muted hover:bg-line hover:text-ink"
                >
                  Remove
                </button>
              </div>
              {missing ? (
                <p className="text-[13px] font-semibold">Add the company name to include this one.</p>
              ) : r.parsed ? (
                <p className="text-[13px] text-muted">Read from the link. Check that it&apos;s right.</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
