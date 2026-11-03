"use client";
import { forwardRef } from "react";
import { Chip, ChipGroup, StepHeader, TagInput } from "@/components/onboarding/controls";
import {
  JOB_TYPES,
  MAX_ROLES,
  START_TIMINGS,
  type Answers,
  type JobType,
  type StartTiming,
} from "@/lib/onboarding";

type Props = { answers: Answers; set: (patch: Partial<Answers>) => void };

/** Step 2: "What are you looking for?" (settled: "What role do you want next?") */
export const StepLooking = forwardRef<HTMLHeadingElement, Props>(function StepLooking({ answers, set }, ref) {
  const settled = answers.situation === "settled";
  return (
    <>
      <StepHeader
        ref={ref}
        step={2}
        title={settled ? "What role do you want next?" : "What are you looking for?"}
        sub="Ask Nudge uses this to give advice that fits, so you don't have to explain your search every time."
      />

      <div className="mb-7 grid gap-2">
        <label htmlFor="ob-roles" className="text-[14.5px] font-bold">
          Roles <span className="ml-1 text-[13px] font-semibold text-muted">Up to {MAX_ROLES}</span>
        </label>
        <TagInput
          id="ob-roles"
          values={answers.targetRoles}
          onChange={(targetRoles) => set({ targetRoles })}
          max={MAX_ROLES}
          placeholder="For example, Brand Coordinator"
        />
      </div>

      <div className="mb-7 grid gap-2">
        <label htmlFor="ob-where" className="text-[14.5px] font-bold">
          Where
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="ob-where"
            className="input min-h-12 min-w-0 flex-[1_1_220px]"
            autoComplete="address-level2"
            placeholder="City or region"
            maxLength={120}
            value={answers.location}
            onChange={(e) => set({ location: e.target.value })}
          />
          <Chip pressed={answers.openToRemote} onClick={() => set({ openToRemote: !answers.openToRemote })}>
            Open to remote
          </Chip>
        </div>
      </div>

      <ChipGroup<JobType>
        legend="Type of job"
        options={JOB_TYPES}
        value={answers.jobTypes}
        onChange={(v) => set({ jobTypes: v as JobType[] })}
      />

      <ChipGroup<StartTiming>
        legend="When do you want to start?"
        options={START_TIMINGS}
        value={answers.startTiming}
        onChange={(v) => set({ startTiming: v as StartTiming | null })}
      />
    </>
  );
});
