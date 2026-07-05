"use client";

import type { ReactNode } from "react";
import { useState } from "react";

interface ExpandableSectionProps {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function ExpandableSection({
  summary,
  children,
  defaultOpen = false,
  className = "",
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full min-h-10 items-center justify-between gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-left text-sm font-medium touch-manipulation"
      >
        <span className="min-w-0 truncate">{summary}</span>
        <svg
          aria-hidden
          className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}
