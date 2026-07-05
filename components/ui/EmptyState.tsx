import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-12 text-center shadow-sm"
      role="status"
    >
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
        {description}
      </p>
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}
