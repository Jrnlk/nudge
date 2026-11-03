"use client";
import { useEffect, useRef } from "react";

/** Thin wrapper over the native <dialog>, which handles focus trapping and Esc. */
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(560px,94vw)] rounded-card bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45"
    >
      {open && children}
    </dialog>
  );
}
