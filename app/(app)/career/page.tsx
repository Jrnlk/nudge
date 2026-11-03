"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHead } from "@/components/ui/Card";
import { useStore } from "@/lib/store";

export default function CareerPage() {
  const { career, goals, setCareer, toggleGoal, addGoal, removeGoal, sendMessage } = useStore();
  const router = useRouter();
  const [newGoal, setNewGoal] = useState("");

  const plan = () => {
    sendMessage(
      `Make me a short get-ahead plan. I work as ${career.title || "[role not set]"} at ${career.company || "[company not set]"}, and I want to become ${career.next || "[goal not set]"}. Give me 3 to 5 concrete steps for the next six months.`,
    );
    router.push("/ask");
  };

  const fields = [
    { key: "company", label: "Company", placeholder: "Where you work, or where you are headed" },
    { key: "title", label: "Your role", placeholder: "Your job title" },
    { key: "next", label: "Where you want to be next", placeholder: "For example, Brand Manager in two years" },
  ] as const;

  return (
    <>
      <PageHead title="Career" subtitle="Once you land the job, plan how to grow in it." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Where you work">
          {fields.map((f) => (
            <div key={f.key} className="mb-3.5 grid gap-1.5">
              <label htmlFor={`c_${f.key}`} className="text-[13px] font-bold">{f.label}</label>
              <input id={`c_${f.key}`} className="input" placeholder={f.placeholder} value={career[f.key]} onChange={(e) => setCareer({ [f.key]: e.target.value })} />
            </div>
          ))}
          <Button size="sm" onClick={plan}>Ask Nudge for a get-ahead plan</Button>
        </Card>

        <Card title="Goals and milestones">
          {goals.length ? goals.map((g) => (
            <label key={g.id} className="mb-2 flex items-start gap-2.5 rounded-tile bg-surface px-3.5 py-3">
              <input type="checkbox" checked={g.done} onChange={() => toggleGoal(g.id)} className="mt-1 accent-[var(--s-interview)]" />
              <span className={g.done ? "text-muted line-through" : ""}>{g.text}</span>
              <button type="button" onClick={(e) => { e.preventDefault(); removeGoal(g.id); }} aria-label="Remove goal" className="ml-auto text-[13px] font-semibold text-muted">Remove</button>
            </label>
          )) : (
            <p className="mb-3 text-[13px] text-muted">Add goals for your next role, like a certification, a project to lead, or a skill to build.</p>
          )}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newGoal.trim()) { addGoal(newGoal.trim()); setNewGoal(""); } }}>
            <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} className="input" placeholder="Add a goal, like “Lead a campaign”" aria-label="New goal" />
            <Button size="sm" type="submit">Add</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
