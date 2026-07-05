"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { IconButton } from "@/components/ui/IconButton";

interface InfoSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function InfoSheet({ open, title, onClose, children }: InfoSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close info"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-sheet-title"
        className="relative z-10 w-full max-w-lg rounded-t-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-[var(--shadow-elevated)] sm:rounded-2xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="info-sheet-title" className="text-sm font-semibold">
            {title}
          </h2>
          <IconButton
            icon={
              <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            label="Close"
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        </div>
        <div className="text-sm leading-relaxed text-[var(--muted)]">{children}</div>
      </div>
    </div>
  );
}
