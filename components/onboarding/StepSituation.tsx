"use client";
import { forwardRef } from "react";
import { ChipGroup, StepHeader } from "@/components/onboarding/controls";
import { SITUATIONS, TRACKING, type Answers, type Tracking } from "@/lib/onboarding";

type Props = { answers: Answers; set: (patch: Partial<Answers>) => void; askName: boolean };

/** Step 1: "Where are you right now?" */
export const StepSituation = forwardRef<HTMLHeadingElement, Props>(function StepSituation({ answers, set, askName }, ref) {
  return (
    <>
      <StepHeader
        ref={ref}
        step={1}
        title="Where are you right now?"
        sub="Nudge uses this to decide what to show you first. You can change it later."
      />

      {askName && (
        <div className="mb-7 grid gap-2">
          <label htmlFor="ob-first-name" className="text-[14.5px] font-bold">
            What should we call you?
          </label>
          <input
            id="ob-first-name"
            className="input min-h-12 max-w-[320px]"
            autoComplete="given-name"
            placeholder="Your first name"
            value={answers.firstName}
            maxLength={80}
            onChange={(e) => set({ firstName: e.target.value })}
          />
        </div>
      )}

      <fieldset className="mb-8">
        <legend className="sr-only">Where are you in your search?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SITUATIONS.map((s) => (
            <label
              key={s.value}
              className="relative grid min-h-[76px] cursor-pointer content-center gap-0.5 rounded-tile border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-soft has-checked:border-ink has-checked:bg-hero has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
            >
              <input
                type="radio"
                name="situation"
                value={s.value}
                checked={answers.situation === s.value}
                onChange={() => set({ situation: s.value })}
                className="sr-only"
              />
              <span className="text-[15.5px] font-extrabold">{s.label}</span>
              <span className="text-[13.5px] text-muted">{s.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ChipGroup<Tracking>
        legend="What have you used to keep track so far?"
        optional
        options={TRACKING}
        value={answers.trackingMethod}
        onChange={(v) => set({ trackingMethod: v as Tracking | null })}
      />
    </>
  );
});
