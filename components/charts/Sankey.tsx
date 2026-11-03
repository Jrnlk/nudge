import type { Application } from "@/lib/types";

/**
 * "Where your applications went": Applied, then Heard back / Still waiting /
 * No response, then Interviewing / Offer / Rejected.
 * KNOWN ISSUE: labels get too small on phones. Needs a vertical layout below ~520px.
 */
export function Sankey({ apps }: { apps: Application[] }) {
  const sent = apps.filter((a) => a.status !== "Researching");
  const N = sent.length;
  if (!N) {
    return <p className="m-0 text-[13px] text-muted">Once you start applying, you will see where each application ends up.</p>;
  }
  const n = (k: string) => sent.filter((a) => a.status === k).length;

  type Node = { k?: string; label: string; v: number; c: string; y: number; h: number };
  const mk = (label: string, v: number, c: string, k?: string): Node => ({ k, label, v, c, y: 0, h: 0 });
  const L1 = [
    mk("Heard back", n("Interviewing") + n("Offer") + n("Rejected"), "var(--s-interview)", "heard"),
    mk("Still waiting", n("Applied"), "var(--s-applied)"),
    mk("No response", n("Archived"), "var(--s-closed)"),
  ].filter((x) => x.v);
  const L2 = [
    mk("Interviewing", n("Interviewing"), "var(--s-interview)"),
    mk("Offer", n("Offer"), "var(--s-offer)"),
    mk("Rejected", n("Rejected"), "var(--s-rejected)"),
  ].filter((x) => x.v);

  const H = 260, NW = 12, gap = 16, X = [0, 300, 600];
  const avail = H - gap * (L1.length - 1);
  let y = 0;
  L1.forEach((x) => { x.h = (avail * x.v) / N; x.y = y; y += x.h + gap; });
  const root = mk("Applied", N, "var(--ink)");
  root.h = H;
  const heard = L1.find((x) => x.k === "heard");
  if (heard) {
    let yy = Math.max(heard.y - ((L2.length - 1) * gap) / 2, -10);
    L2.forEach((x) => { x.h = (heard.h * x.v) / heard.v; x.y = yy; yy += x.h + gap; });
  }

  const band = (x0: number, y0: number, x1: number, y1: number, h0: number, h1: number, c: string, key: string) => {
    const m = (x0 + x1) / 2;
    return (
      <path key={key} fill={c} opacity=".28"
        d={`M${x0} ${y0} C${m} ${y0} ${m} ${y1} ${x1} ${y1} L${x1} ${y1 + h1} C${m} ${y1 + h1} ${m} ${y0 + h0} ${x0} ${y0 + h0} Z`} />
    );
  };
  const bands: React.ReactNode[] = [];
  let off = 0;
  L1.forEach((x) => { const h = (H * x.v) / N; bands.push(band(X[0] + NW, off, X[1], x.y, h, x.h, x.c, "a" + x.label)); off += h; });
  if (heard) { let o2 = 0; L2.forEach((x) => { bands.push(band(X[1] + NW, heard.y + o2, X[2], x.y, x.h, x.h, x.c, "b" + x.label)); o2 += x.h; }); }

  const node = (nd: Node, x: number, left = false) => (
    <g key={nd.label}>
      <rect x={x} y={nd.y} width={NW} height={Math.max(nd.h, 3)} rx="3" fill={nd.c} />
      <text x={left ? x - 10 : x + NW + 10} y={nd.y + nd.h / 2 - 2} textAnchor={left ? "end" : "start"} className="fill-ink text-[13.5px] font-bold">{nd.label}</text>
      <text x={left ? x - 10 : x + NW + 10} y={nd.y + nd.h / 2 + 15} textAnchor={left ? "end" : "start"} className="fill-muted text-xs">
        {nd.v} {nd.v === 1 ? "application" : "applications"}
      </text>
    </g>
  );

  const rate = heard ? Math.round((heard.v / N) * 100) : 0;
  return (
    <>
      <svg viewBox={`-120 -24 ${X[2] + 290} ${H + 48}`} className="block h-auto w-full overflow-visible" role="img"
        aria-label={`${N} applications: ${L1.map((x) => `${x.v} ${x.label.toLowerCase()}`).join(", ")}`}>
        {bands}
        {node(root, X[0], true)}
        {L1.map((x) => node(x, X[1]))}
        {L2.map((x) => node(x, X[2]))}
      </svg>
      <p className="mt-2 text-[13px] text-muted">
        You have heard back from <strong className="text-ink">{rate}%</strong> of the companies you applied to.
        {rate > 0 && rate < 30 ? " That is normal early on, and follow-ups help." : ""}
      </p>
    </>
  );
}
