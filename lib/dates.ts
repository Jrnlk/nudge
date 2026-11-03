/** Date helpers. Dates are stored as ISO strings (YYYY-MM-DD) in local time. */

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isoDaysAgo(n: number): string {
  const d = today();
  d.setDate(d.getDate() - n);
  return toISO(d);
}

export function parseISO(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** "Oct 24". Fixed locale so server and client render the same text. */
export function fmtShort(value?: string | Date | null): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
}
