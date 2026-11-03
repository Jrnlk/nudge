"use client";
import { statusColor, bucketOf } from "@/lib/services/applications";
import { useStore } from "@/lib/store";
import type { Application } from "@/lib/types";

/**
 * Spider-web view: "You" in the center, people in the inner ring, companies in
 * the outer ring. Solid green line = you know someone there, dashed = no contact.
 * KNOWN ISSUE: gets crowded past ~10 to 15 nodes. Needs zoom, filtering, or grouping.
 */
export function NetworkWeb() {
  const { people, apps, openEditor } = useStore();
  const norm = (s?: string) => (s ?? "").trim().toLowerCase();

  type Co = { k: string; name: string; app?: Application; ang: number; pref: number; x: number; y: number; linked: PNode[] };
  type PNode = { id: string; name: string; relationship?: string; org?: string; ang: number; x: number; y: number };

  const cos: Co[] = [];
  const addCo = (name?: string, app?: Application) => {
    const k = norm(name);
    if (!k) return;
    let c = cos.find((x) => x.k === k);
    if (!c) { c = { k, name: name!, ang: 0, pref: 99, x: 0, y: 0, linked: [] }; cos.push(c); }
    if (app && !c.app) c.app = app;
  };
  apps.filter((a) => a.status !== "Archived").forEach((a) => addCo(a.company, a));
  people.forEach((p) => addCo(p.org));

  if (!people.length && !cos.length) {
    return (
      <div className="rounded-tile bg-soft p-7 text-center text-muted">
        <strong className="block text-[17px] text-ink">Your network will show up here</strong>
        Add people and the companies they work at, and Nudge draws the connections.
      </div>
    );
  }

  const W = 640, H = 440, cx = W / 2, cy = H / 2;
  const P = people.length, C = cos.length;
  const pt = (ang: number, rx: number, ry: number): [number, number] => [cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry];
  const pa: PNode[] = people.map((p, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(P, 1);
    const [x, y] = pt(ang, 135, 110);
    return { id: p.id, name: p.name, relationship: p.relationship, org: p.org, ang, x, y };
  });
  cos.forEach((c) => {
    c.linked = pa.filter((x) => norm(x.org) === c.k);
    if (c.linked.length)
      c.pref = Math.atan2(c.linked.reduce((s, x) => s + Math.sin(x.ang), 0), c.linked.reduce((s, x) => s + Math.cos(x.ang), 0));
  });

  const N = Math.max(C, P, 1);
  const slots = [...Array(N)].map((_, i) => -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / N);
  const used = new Set<number>();
  const dist = (a: number, b: number) => { const d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
  const ordered = [...cos].sort((a, b) => Number(a.pref === 99) - Number(b.pref === 99));
  ordered.forEach((c) => {
    let best = -1, bd = 9;
    slots.forEach((s, i) => {
      if (used.has(i)) return;
      const dd = c.pref === 99 ? (pa.some((x) => dist(x.ang, s) < 0.2) ? 5 : 1) + i * 1e-3 : dist(s, c.pref);
      if (dd < bd) { bd = dd; best = i; }
    });
    used.add(best);
    c.ang = slots[best];
    [c.x, c.y] = pt(c.ang, 262, 180);
  });

  const trunc = (t: string) => (t.length > 18 ? t.slice(0, 17) + "…" : t);
  const label = (x: number, y: number, t: string, sub?: string) => (
    <>
      <text x={x} y={y + 34} textAnchor="middle" className="fill-ink text-[13px] font-bold">{trunc(t)}</text>
      {sub && <text x={x} y={y + 49} textAnchor="middle" className="fill-muted text-[11.5px]">{sub}</text>}
    </>
  );

  const appCos = ordered.filter((c) => c.app);
  const known = appCos.filter((c) => c.linked.length);
  const gaps = appCos.filter((c) => !c.linked.length && ["Researching", "Applied"].includes(c.app!.status)).map((c) => c.name);

  return (
    <div>
      <svg viewBox={`-40 -20 ${W + 80} ${H + 70}`} className="block h-auto w-full" role="img" aria-label={`Your network: ${P} people connected to ${C} companies`}>
        <ellipse cx={cx} cy={cy} rx="135" ry="110" fill="none" stroke="var(--line)" strokeDasharray="3 6" />
        <ellipse cx={cx} cy={cy} rx="262" ry="180" fill="none" stroke="var(--line)" strokeDasharray="3 6" />
        {pa.map((p) => <line key={p.id} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--line)" strokeWidth="1.6" />)}
        {ordered.map((c) =>
          c.linked.length ? (
            c.linked.map((p) => {
              const mx = (p.x + c.x) / 2, my = (p.y + c.y) / 2;
              return <path key={c.k + p.id} d={`M${p.x} ${p.y} Q${mx + (mx - cx) * 0.18} ${my + (my - cy) * 0.18} ${c.x} ${c.y}`} fill="none" stroke="var(--s-interview)" strokeWidth="2.2" />;
            })
          ) : (
            <line key={c.k} x1={cx} y1={cy} x2={c.x} y2={c.y} stroke="var(--muted)" strokeDasharray="4 5" opacity=".6" />
          ),
        )}
        {pa.map((p) => (
          <g key={p.id} tabIndex={0} role="button" aria-label={p.name} className="cursor-pointer" onClick={() => openEditor("people", p.id)}
            onKeyDown={(e) => e.key === "Enter" && openEditor("people", p.id)}>
            <circle cx={p.x} cy={p.y} r="19" fill="var(--ink)" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" className="text-sm font-extrabold" fill="var(--paper)">{p.name.charAt(0).toUpperCase()}</text>
            {label(p.x, p.y, p.name, p.relationship)}
          </g>
        ))}
        {ordered.map((c) => (
          <g key={c.k} aria-label={c.name} {...(c.app ? { tabIndex: 0, role: "button", className: "cursor-pointer", onClick: () => openEditor("apps", c.app!.id) } : {})}>
            <rect x={c.x - 17} y={c.y - 17} width="34" height="34" rx="9" fill={c.app ? statusColor(bucketOf(c.app)) : "var(--s-research)"} />
            <text x={c.x} y={c.y + 5} textAnchor="middle" className="text-sm font-extrabold" fill="#fff">{c.name.charAt(0).toUpperCase()}</text>
            {label(c.x, c.y, c.name, c.app ? bucketOf(c.app) : undefined)}
          </g>
        ))}
        <circle cx={cx} cy={cy} r="26" fill="var(--brand)" />
        <text x={cx} y={cy + 5} textAnchor="middle" className="text-sm font-extrabold" fill="var(--brand-ink)">You</text>
      </svg>
      <div className="mx-1.5 mt-1 flex flex-wrap gap-[18px] text-[13px] text-muted">
        <span className="flex items-center gap-[7px]"><i className="w-[22px] border-t-2 border-st-interview" />You know someone here</span>
        <span className="flex items-center gap-[7px]"><i className="w-[22px] border-t-2 border-dashed border-muted" />No contact yet</span>
      </div>
      {appCos.length > 0 && (
        <p className="mx-1.5 mt-3 text-[14.5px]">
          <strong>You know someone at {known.length} of the {appCos.length} companies you are tracking.</strong>
          {gaps.length ? ` A connection at ${gaps.length > 2 ? gaps.slice(0, 2).join(", ") + ", or another company on your list" : gaps.join(" or ")} could help you stand out.` : " Nice work."}
        </p>
      )}
    </div>
  );
}
