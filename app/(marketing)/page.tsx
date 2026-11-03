import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const STEPS = [
  { n: 1, title: "Add a job in seconds", text: "Paste a link from Workday, Greenhouse, or Lever, and Nudge fills in what it can. Add a status, and you are done." },
  { n: 2, title: "See only what matters today", text: "Your Today screen lists just the few things that need you: follow-ups that are due, interviews to prep, and people to get back to." },
  { n: 3, title: "Get help when you are stuck", text: "Ask Nudge to tailor your resume to a posting, prep you for an interview, or outline what to research before you apply." },
  { n: 4, title: "Keep growing once you are hired", text: "Set goals for the job you land, check them off as you go, and ask for a plan to reach your next role." },
];

/**
 * TODO(design): the prototype showed small UI previews beside each step. Add
 * those back as components once the app screens settle, so they stay in sync.
 */
export default function Landing() {
  return (
    <>
      <nav className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-5 py-4">
        <Logo />
        <div className="flex items-center gap-1.5">
          <ButtonLink href="/login" variant="link">Log in</ButtonLink>
          <ButtonLink href="/signup">Sign up free</ButtonLink>
        </div>
      </nav>

      <div className="bg-hero">
        <div className="mx-auto max-w-[1120px] px-5 pb-16 pt-14">
          <h1 className="mb-4 max-w-[12em] text-[clamp(40px,6vw,66px)] font-extrabold leading-[1.03] tracking-[-0.035em]">
            Your whole career, one calm place.
          </h1>
          <p className="mb-6 max-w-[31em] text-lg text-muted">
            Track your job search, keep your people close, and plan what is next once you are hired. Nudge shows you what matters today and hides the rest.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href="/signup" variant="brand">Start free</ButtonLink>
            <ButtonLink href="/today" variant="ghost">See the demo</ButtonLink>
          </div>
        </div>
      </div>

      <section id="how" className="mx-auto max-w-[1120px] px-5 pb-10 pt-16" aria-labelledby="how-title">
        <h2 id="how-title" className="mb-2 text-[clamp(30px,4.4vw,44px)] font-extrabold leading-tight">How Nudge works</h2>
        <p className="mb-10 text-[17px] text-muted">Four simple steps, and no feed to scroll through.</p>
        {STEPS.map((s) => (
          <div key={s.n} className="border-t border-line py-7">
            <span className="mb-3 grid size-8 place-items-center rounded-full bg-brand font-extrabold text-brand-ink">{s.n}</span>
            <h3 className="mb-2 text-2xl font-extrabold">{s.title}</h3>
            <p className="max-w-[30em] text-base text-muted">{s.text}</p>
          </div>
        ))}
      </section>

      <div className="mx-auto mb-16 max-w-[1120px] px-5">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-card bg-ink px-9 py-10 text-paper">
          <h2 className="text-[clamp(26px,3.6vw,38px)] font-extrabold leading-tight">The job app that does not shout.</h2>
          <ButtonLink href="/signup" variant="brand">Create your free account</ButtonLink>
        </div>
      </div>

      <footer className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-3 px-5 pb-10 text-[13.5px] text-muted">
        <span>© 2026 Nudge</span>
        <span>For people who would rather be prepared than overwhelmed.</span>
      </footer>
    </>
  );
}
