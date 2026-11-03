import type { AppData } from "@/lib/types";
import { bucketOf } from "@/lib/services/applications";

/** System prompt for Ask Nudge. Rules from CLAUDE.md: never invent experience, say plainly it cannot browse the web. */
export const ASK_SYSTEM_PROMPT = `You are the career assistant inside Nudge, a calm job search app. Be friendly and encouraging. Keep answers short, warm, and practical: a few sentences or a short list, plain language, no long preambles.

You help with tailoring resumes to job descriptions (never invent experience, and ask the person to supply real numbers), researching companies (say clearly that you cannot browse the web and that facts may be out of date, and suggest what to verify), interview prep, networking, and getting ahead at a current job. If the user has not given enough detail, ask one short question.`;

/** The user's tracker, summarized as context for the model. */
export function trackerContext(d: AppData): string {
  const apps = d.apps
    .filter((a) => a.status !== "Archived")
    .map((a) => `${a.company} (${a.role || "role not set"}, ${bucketOf(a)})`)
    .join("; ");
  const goals = d.goals.map((g) => g.text + (g.done ? " (done)" : "")).join("; ");
  return `User's tracker (use only if relevant):
- Applications: ${apps || "none"}
- Current job: ${d.career.title || "not set"} at ${d.career.company || "not set"}; wants to reach: ${d.career.next || "not set"}
- Goals: ${goals || "none"}`;
}
