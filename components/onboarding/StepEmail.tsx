"use client";
import { forwardRef } from "react";
import { StepHeader } from "@/components/onboarding/controls";

const OPTIONS = [
  {
    id: "inbox",
    title: "Connect your inbox",
    recommended: true,
    body: "Nudge reads job emails like confirmations, interviews, and rejections, and suggests updates for you to approve. Read-only, and only job-related emails.",
  },
  {
    id: "forward",
    title: "Forward job emails",
    recommended: false,
    body: "Get a private address and forward job emails to it. You choose what gets sent.",
  },
] as const;

/**
 * Step 4: "Keep your tracker up to date automatically."
 * Both options are previews only: not buttons, not focusable, no hover or press
 * effects, and marked aria-disabled. "Continue to Nudge" in the footer finishes.
 */
export const StepEmail = forwardRef<HTMLHeadingElement, { added: number }>(function StepEmail({ added }, ref) {
  return (
    <>
      <StepHeader
        ref={ref}
        step={4}
        title="Keep your tracker up to date automatically"
        sub="Soon Nudge can notice job emails for you, so your list stays current without extra typing."
      />

      {added > 0 && (
        <p role="status" className="mb-5 rounded-tile bg-soft px-4 py-3 text-[14.5px]">
          Added {added} application{added === 1 ? "" : "s"} to your list.
        </p>
      )}

      <ul className="grid gap-3">
        {OPTIONS.map((o) => (
          <li
            key={o.id}
            role="group"
            aria-disabled="true"
            aria-labelledby={`ob-email-${o.id}-title ob-email-${o.id}-soon`}
            aria-describedby={`ob-email-${o.id}-body`}
            className="pointer-events-none grid cursor-default select-none gap-2 rounded-tile border border-dashed border-line bg-soft px-4 py-4 sm:px-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={`ob-email-${o.id}-title`} className="text-[16px] font-extrabold text-muted">
                {o.title}
              </h3>
              {o.recommended && (
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-[12px] font-bold text-muted shadow-[inset_0_0_0_1px_var(--line)]">
                  Recommended
                </span>
              )}
              <span
                id={`ob-email-${o.id}-soon`}
                className="ml-auto rounded-full bg-hero px-2.5 py-0.5 text-[12px] font-bold text-ink"
              >
                Coming soon
              </span>
            </div>
            <p id={`ob-email-${o.id}-body`} className="text-[14px] text-muted">
              {o.body}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[14.5px] text-muted">You can always add applications yourself. This is optional.</p>
    </>
  );
});
