/**
 * Link prefill. Runs on the server (see app/api/prefill/route.ts).
 *
 * Supported today:
 *  - Workday: company, role, location (all readable from the URL itself)
 *  - Greenhouse, Lever, Ashby: company only
 *  - LinkedIn, Indeed: nothing usable in the address, returns {}
 *
 * Nothing here fetches the URL. If you ever do fetch the page, you MUST first
 * resolve DNS and reject private addresses (see TODO in assertSafeUrl).
 */

export interface Prefill {
  company?: string;
  role?: string;
  location?: string;
  /**
   * The company was rebuilt from a slug or subdomain, not readable text, so
   * words can run together ("oceanspray" -> "Oceanspray"). Ask the person to check it.
   */
  companyUncertain?: boolean;
}

const nice = (s: string) =>
  s
    .replace(/[-_+]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Throws if the URL is not a plain public http(s) URL. */
export function assertSafeUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("That does not look like a link.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("Only http and https links are supported.");
  }
  if (u.username || u.password) throw new Error("Links with logins are not supported.");

  const host = u.hostname.toLowerCase();
  const blockedName = host === "localhost" || host.endsWith(".local") || host.endsWith(".internal");
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  const privateV4 =
    !!ipv4 &&
    (() => {
      const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
      return (
        a === 10 || a === 127 || a === 0 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      );
    })();
  const ipv6 = host.startsWith("[");
  if (blockedName || privateV4 || ipv6) throw new Error("That address is not allowed.");

  // TODO: only needed if we start fetching pages. Resolve DNS for `host` and
  // reject any address in a private, loopback, or link-local range.
  return u;
}

export function parseJobUrl(raw: string): Prefill {
  const u = assertSafeUrl(raw);
  const host = u.hostname.replace(/^www\./, "");
  const seg = u.pathname.split("/").filter(Boolean);

  if (/myworkdayjobs\.com$/.test(host)) {
    const j = seg.indexOf("job");
    let loc = "";
    let title = "";
    if (j >= 0) {
      if (seg.length > j + 2) {
        loc = seg[j + 1];
        title = seg[j + 2];
      } else title = seg[j + 1] ?? "";
    }
    return {
      company: nice(host.split(".")[0]),
      companyUncertain: true, // from the subdomain
      role: nice(title.replace(/_[A-Z]*-?\d[\w-]*$/, "")),
      location: loc.replace(/-([A-Z]{2})$/, ", $1").replace(/-/g, " "),
    };
  }
  if (/greenhouse\.io$|lever\.co$|ashbyhq\.com$/.test(host)) {
    // from the path slug
    return seg[0] ? { company: nice(seg[0]), companyUncertain: true } : {};
  }
  return {};
}
