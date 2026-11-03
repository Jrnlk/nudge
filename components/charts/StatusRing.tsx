import { STATUSES, bucketOf, statusColor } from "@/lib/services/applications";
import type { Application, Bucket } from "@/lib/types";

/** Ring chart + clickable legend. `filter` and `onFilter` are controlled by the page. */
export function StatusRing({
  apps,
  filter,
  onFilter,
}: {
  apps: Application[];
  filter: Bucket | null;
  onFilter: (b: Bucket) => void;
}) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s.key, 0])) as Record<Bucket, number>;
  apps.forEach((a) => counts[bucketOf(a)]++);
  const segs = STATUSES.filter((s) => counts[s.key] && s.key !== "Archived");
  const total = segs.reduce((n, s) => n + counts[s.key], 0);
  const r = 54;
  const C = 2 * Math.PI * r;
  const gap = segs.length > 1 ? 3 : 0;
  const lens = segs.map((s) => (C * counts[s.key]) / total);
  const offsets = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <section aria-label="Pipeline by status" className="mb-5 flex flex-wrap items-center gap-7 rounded-card bg-soft px-[22px] py-5">
      <svg viewBox="0 0 140 140" className="size-[124px] flex-none" role="img" aria-label={`${total} tracked applications`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
        {segs.map((s, i) => (
          <circle
            key={s.key}
            cx="70" cy="70" r={r} fill="none" stroke={statusColor(s.key)} strokeWidth="12"
            strokeDasharray={`${Math.max(lens[i] - gap, 0.01)} ${C}`}
            strokeDashoffset={-offsets[i]}
            transform="rotate(-90 70 70)"
          >
            <title>{`${s.key}: ${counts[s.key]}`}</title>
          </circle>
        ))}
        <text x="70" y="74" textAnchor="middle" className="fill-ink text-[34px] font-extrabold">{total}</text>
        <text x="70" y="94" textAnchor="middle" className="fill-muted text-xs">tracked</text>
      </svg>
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            aria-pressed={filter === s.key}
            onClick={() => onFilter(s.key)}
            className="flex items-center gap-[7px] rounded-full bg-surface py-1.5 pl-[11px] pr-[13px] text-sm shadow-[inset_0_0_0_1px_var(--line)] aria-pressed:shadow-[inset_0_0_0_2px_var(--ink)]"
          >
            <i className="size-2.5 flex-none rounded-full" style={{ background: s.color }} />
            <b className="font-extrabold">{counts[s.key]}</b> {s.key}
          </button>
        ))}
      </div>
    </section>
  );
}
