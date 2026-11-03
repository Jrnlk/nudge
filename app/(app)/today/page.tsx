"use client";
import { useRouter } from "next/navigation";
import { Sankey } from "@/components/charts/Sankey";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fmtShort, parseISO, today } from "@/lib/dates";
import { isActive, isDue } from "@/lib/services/applications";
import { useStore } from "@/lib/store";

interface Todo {
  title: string;
  sub: string;
  action?: { label: string; run: () => void };
}

export default function TodayPage() {
  const { apps, people, goals, userName, markFollowedUp, openEditor, sendMessage } = useStore();
  const router = useRouter();
  const first = userName.split(" ")[0];
  const due = apps.filter(isDue);
  const interviewing = apps.filter((a) => a.status === "Interviewing");
  const askAbout = (q: string) => () => { sendMessage(q); router.push("/ask"); };

  let tip: string;
  if (!apps.length) tip = `Welcome${first ? ", " + first : ""}. Add your first application and Nudge will keep an eye on it.`;
  else if (due.length) tip = `${due.length === 1 ? due[0].company + " has" : due.length + " applications have"} gone quiet for a week. A short follow-up today could make the difference.`;
  else if (interviewing.length) tip = `You are interviewing with ${interviewing[0].company}. Want help preparing? Ask anytime.`;
  else tip = "Everything is on track. A good day to research one new company you would love to work for.";

  const todos: Todo[] = [
    ...apps.filter((a) => a.status === "Offer").map((a) => ({
      title: `Decide on your ${a.company} offer`, sub: a.notes || a.role,
      action: { label: "Talk it through", run: askAbout(`I have an offer from ${a.company} for the ${a.role} role. Help me evaluate it and think about negotiating.`) },
    })),
    ...due.map((a) => ({
      title: `Follow up with ${a.company}`, sub: `Applied ${fmtShort(a.dateApplied)}, no reply yet`,
      action: { label: "Mark followed up", run: () => markFollowedUp(a.id) },
    })),
    ...interviewing.map((a) => ({
      title: `Prepare for ${a.company}`, sub: a.notes || "Interview in progress",
      action: { label: "Prep with Nudge", run: askAbout(`Help me prepare for my interview with ${a.company} for the ${a.role} role.`) },
    })),
    ...people.filter((p) => p.nextStep).slice(0, 2).map((p) => ({
      title: p.nextStep!, sub: `${p.name}${p.org ? ", " + p.org : ""}`,
    })),
  ];

  const weekAgo = new Date(today().getTime() - 7 * 864e5);
  const thisWeek = apps.filter((a) => { const d = parseISO(a.dateApplied); return d && d >= weekAgo; }).length;
  const done = goals.filter((g) => g.done).length;
  const nextGoal = goals.find((g) => !g.done);

  return (
    <>
      <h1 className="mb-2 text-[clamp(26px,4vw,34px)] font-extrabold leading-tight">Good to see you, {first}</h1>
      <p className="mb-6 rounded-tile bg-hero px-4 py-3">{tip}</p>

      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <Card title="Needs you today">
          <div className="grid gap-2">
            {todos.length ? todos.map((t) => (
              <div key={t.title} className="flex items-center justify-between gap-3 rounded-tile bg-surface px-3.5 py-3">
                <div>
                  <strong>{t.title}</strong>
                  <small className="block text-muted">{t.sub}</small>
                </div>
                {t.action && <Button variant="ghost" size="sm" onClick={t.action.run}>{t.action.label}</Button>}
              </div>
            )) : (
              <div className="rounded-tile bg-surface px-3.5 py-3">
                <strong>Nothing needs you right now</strong>
                <small className="block text-muted">Nudge will add things here when they come up.</small>
              </div>
            )}
          </div>
        </Card>

        <div className="grid content-start gap-4">
          <Card title="Your search at a glance">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                [apps.filter(isActive).length, "active"],
                [interviewing.length, "interviewing"],
                [thisWeek, "applied this week"],
              ].map(([n, label]) => (
                <div key={label} className="rounded-tile bg-surface p-3.5">
                  <b className="block text-[30px] font-extrabold leading-none">{n}</b>
                  <span className="text-[13px] text-muted">{label}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Career goals">
            {goals.length ? (
              <>
                <strong>{done} of {goals.length} done</strong>
                <div className="my-2 h-2 overflow-hidden rounded-full bg-line">
                  <span className="block h-full bg-st-interview" style={{ width: `${Math.round((done / goals.length) * 100)}%` }} />
                </div>
                <small className="text-[13px] text-muted">Next: {nextGoal?.text ?? "all done"}</small>
              </>
            ) : (
              <small className="text-[13px] text-muted">No goals yet. Add one in Career.</small>
            )}
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" size="sm" onClick={() => openEditor("apps")}>Add application</Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/ask")}>Ask Nudge</Button>
          </div>
        </div>
      </div>

      <Card title="Where your applications went" className="mt-4">
        <Sankey apps={apps} />
      </Card>
    </>
  );
}
