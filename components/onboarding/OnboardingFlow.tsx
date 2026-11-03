"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { finishOnboarding, saveProgress, skipSetup } from "@/app/onboarding/actions";
import { StepJobs } from "@/components/onboarding/StepJobs";
import { StepLooking } from "@/components/onboarding/StepLooking";
import { StepSituation } from "@/components/onboarding/StepSituation";
import { Button } from "@/components/ui/Button";
import { LogoMark, APP_NAME } from "@/components/ui/Logo";
import { toISO } from "@/lib/dates";
import type { Answers, DraftRow } from "@/lib/onboarding";

const STEPS = 3;
const SWIPE_DISTANCE = 60; // px
const TEXT_INPUT = 'input:not([type=radio]):not([type=checkbox]), textarea, select, button, a, [contenteditable="true"]';

/**
 * Three onboarding steps side by side in a horizontal track. Continue/Back
 * (and swipes on touch screens) slide between them. Each step's answers are
 * saved when the person leaves it, so a refresh resumes at the same step.
 */
export function OnboardingFlow({
  initialAnswers,
  initialStep,
  askName,
}: {
  initialAnswers: Answers;
  initialStep: number;
  askName: boolean;
}) {
  const [step, setStep] = useState(initialStep);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [rows, setRowsState] = useState<DraftRow[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [drag, setDrag] = useState<number | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);
  const moved = useRef(false);

  const set = useCallback((patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch })), []);
  const setRows = useCallback((u: (r: DraftRow[]) => DraftRow[]) => setRowsState(u), []);

  const settled = answers.situation === "settled";
  const ready = rows.filter((r) => r.company.trim()).length;

  // Keep the viewport's height equal to the visible step, so shorter steps don't leave blank space.
  useLayoutEffect(() => {
    const el = panels.current[step];
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  // After a move, put focus on the new step's heading (for keyboard and screen reader users).
  useEffect(() => {
    if (!moved.current) return;
    headings.current[step]?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [step]);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= STEPS || next === step || pending) return;
      moved.current = true;
      setError("");
      setStep(next);
      // Save what's on the step being left, and where the person is now. Not blocking.
      const snapshot = answers;
      saveProgress(snapshot, next + 1)
        .then((res) => res?.error && setError(res.error))
        .catch(() => setError("We couldn't save that just now. Check your connection and try again."));
    },
    [answers, pending, step],
  );

  const finish = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const res = await finishOnboarding(answers, rows, toISO(new Date()));
        if (res?.error) setError(res.error);
      } catch (e) {
        if (isRedirect(e)) throw e;
        setError("We couldn't finish setting up just now. Check your connection and try again.");
      }
    });
  }, [answers, rows]);

  const skip = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const res = await skipSetup(answers);
        if (res?.error) setError(res.error);
      } catch (e) {
        if (isRedirect(e)) throw e;
        setError("We couldn't skip setup just now. Check your connection and try again.");
      }
    });
  }, [answers]);

  const next = useCallback(() => (step === STEPS - 1 ? finish() : goTo(step + 1)), [finish, goTo, step]);

  // Enter = Continue, except inside text fields and on buttons/links (they handle Enter themselves).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter" || e.defaultPrevented || e.nativeEvent.isComposing) return;
    if ((e.target as HTMLElement).closest(TEXT_INPUT)) return;
    e.preventDefault();
    next();
  }

  // Touch swipes. Forward always works (every step is optional); the last step only finishes via its button.
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1 || pending) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null };
  }
  function onTouchMove(e: React.TouchEvent) {
    const t = touch.current;
    if (!t) return;
    const dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;
    if (t.horizontal === null && Math.abs(dx) + Math.abs(dy) > 10) t.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
    if (!t.horizontal) return;
    const atEdge = (dx > 0 && step === 0) || (dx < 0 && step === STEPS - 1);
    setDrag(atEdge ? dx / 4 : dx); // resist at the ends
  }
  function onTouchEnd() {
    const dx = drag ?? 0;
    touch.current = null;
    setDrag(null);
    if (dx <= -SWIPE_DISTANCE && step < STEPS - 1) goTo(step + 1);
    else if (dx >= SWIPE_DISTANCE && step > 0) goTo(step - 1);
  }

  const continueLabel =
    step < STEPS - 1
      ? "Continue"
      : pending
        ? "Adding…"
        : ready
          ? `Add ${ready} application${ready === 1 ? "" : "s"}`
          : "Skip for now";

  return (
    <div className="min-h-dvh bg-paper" onKeyDown={onKeyDown}>
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur">
        <div className="mx-auto grid max-w-[640px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-3">
          <span className="inline-flex items-center gap-2 text-[19px] font-extrabold tracking-tight">
            <LogoMark size={28} />
            <span className="hidden sm:inline">{APP_NAME}</span>
          </span>
          <div
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={1}
            aria-valuemax={STEPS}
            aria-valuenow={step + 1}
            aria-valuetext={`Step ${step + 1} of ${STEPS}`}
            className="flex gap-1.5"
          >
            {Array.from({ length: STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-9 rounded-full transition-colors duration-300 motion-reduce:transition-none sm:w-12 ${
                  i <= step ? "bg-ink" : "bg-line"
                }`}
              />
            ))}
          </div>
          <div className="justify-self-end">
            <button
              type="button"
              onClick={skip}
              disabled={pending}
              className="min-h-11 rounded-full px-3 text-[14px] font-bold text-ink hover:bg-soft disabled:opacity-50"
            >
              Skip setup
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-3 pb-36 pt-6 sm:px-3">
        <div
          className="overflow-clip transition-[height] duration-300 ease-out motion-reduce:transition-none"
          style={{ height }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            className={`flex items-start [touch-action:pan-y] ${
              drag === null ? "transition-transform duration-300 ease-out motion-reduce:transition-none" : ""
            }`}
            style={{ transform: `translate3d(calc(${-step * 100}% + ${drag ?? 0}px), 0, 0)` }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                ref={(el) => {
                  panels.current[i] = el;
                }}
                className="w-full shrink-0 px-2 pb-2 pt-1"
                inert={i !== step}
              >
                {i === 0 && (
                  <StepSituation ref={(el) => void (headings.current[0] = el)} answers={answers} set={set} askName={askName} />
                )}
                {i === 1 && <StepLooking ref={(el) => void (headings.current[1] = el)} answers={answers} set={set} />}
                {i === 2 && (
                  <StepJobs ref={(el) => void (headings.current[2] = el)} settled={settled} rows={rows} setRows={setRows} />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-[640px] px-5 py-3">
          <p aria-live="polite" className={error ? "mb-2 rounded-tile bg-hero px-3 py-2 text-[13.5px]" : "sr-only"}>
            {error}
          </p>
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => goTo(step - 1)}
              disabled={pending}
              className={`min-h-12 px-6 ${step === 0 ? "invisible" : ""}`}
              aria-hidden={step === 0}
              tabIndex={step === 0 ? -1 : undefined}
            >
              Back
            </Button>
            <Button onClick={next} disabled={pending} className="min-h-12 px-7">
              {continueLabel}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** next/navigation's redirect() works by throwing; let it through. */
function isRedirect(e: unknown) {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}
