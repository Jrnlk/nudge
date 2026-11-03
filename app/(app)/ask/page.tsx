"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { useStore } from "@/lib/store";

const SUGGESTIONS = [
  ["Tailor my resume to a job", "I want to tailor my resume to a job. I will paste the job description and my resume next. Tell me what to send."],
  ["Research a company", "Help me research a company before I apply. Ask me which company, then tell me what to look into."],
  ["Prep for an interview", "Help me prep for an upcoming interview. Ask me about the role first."],
  ["Stand out at a new job", "How do I stand out in my first six months at a new job?"],
];

export default function AskPage() {
  const { chat, sending, sendMessage, userName } = useStore();
  const [text, setText] = useState("");
  const send = (t: string) => { sendMessage(t); setText(""); };

  return (
    <div className="grid min-h-[60vh] grid-rows-[auto_1fr_auto] gap-3.5">
      <div>
        <h1 className="text-[clamp(26px,4vw,34px)] font-extrabold leading-tight">Ask Nudge</h1>
        <p className="text-[13px] text-muted">Tailor your resume, research a company, prep for interviews, or plan your next step.</p>
      </div>

      <div className="grid content-start gap-3.5">
        <Bubble>
          Hi {userName.split(" ")[0]}! I can tailor your resume to a job, research a company, help you prep for interviews, or plan how to get ahead once you are hired. What are you working on?
        </Bubble>
        {chat.map((m, i) => <Bubble key={i} user={m.role === "user"}>{m.pending ? "Thinking…" : m.content}</Bubble>)}
      </div>

      <div>
        {!chat.length && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {SUGGESTIONS.map(([label, q]) => (
              <button key={label} onClick={() => send(q)} className="rounded-full bg-surface px-3.5 py-2 text-sm font-semibold shadow-[inset_0_0_0_1px_var(--line)] hover:shadow-[inset_0_0_0_1px_var(--muted)]">
                {label}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); send(text); }}
          className="flex items-end gap-2 rounded-card border border-line bg-surface p-2 focus-within:border-focus"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
            placeholder="Ask Nudge anything about your search or career"
            aria-label="Message Nudge"
            className="max-h-[220px] min-h-12 w-full resize-y border-0 bg-transparent p-2 outline-none"
          />
          <Button type="submit" variant="brand" disabled={sending}>Send</Button>
        </form>
        <p className="mt-2 text-[13px] text-muted">Nudge cannot browse the web, so company facts may be out of date. Double-check anything important.</p>
      </div>
    </div>
  );
}

function Bubble({ children, user }: { children: React.ReactNode; user?: boolean }) {
  return (
    <div className={`flex max-w-[760px] items-start gap-3 ${user ? "ml-auto flex-row-reverse" : ""}`}>
      {!user && <span className="flex-none"><LogoMark /></span>}
      <div className={`whitespace-pre-wrap rounded-tile px-3.5 py-3 ${user ? "bg-ink text-paper" : "bg-soft"}`}>{children}</div>
    </div>
  );
}
