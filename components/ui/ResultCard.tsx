import type { ReactNode } from "react";

interface ResultCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function ResultCard({ children, title, className = "" }: ResultCardProps) {
  return (
    <article
      className={`card-surface overflow-hidden ${className}`}
      aria-live="polite"
    >
      {title && (
        <div className="border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </article>
  );
}
