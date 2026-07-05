interface LoadingStateProps {
  title?: string;
  label?: string;
}

export function LoadingState({
  title = "Loading",
  label = "Please wait…",
}: LoadingStateProps) {
  return (
    <div
      className="card-surface flex flex-col items-center justify-center px-6 py-12 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]"
        aria-hidden
      />
      <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
    </div>
  );
}
