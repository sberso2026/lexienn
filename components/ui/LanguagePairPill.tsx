interface LanguagePairPillProps {
  fromLabel: string;
  toLabel: string;
  onClick?: () => void;
}

export function LanguagePairPill({ fromLabel, toLabel, onClick }: LanguagePairPillProps) {
  const content = (
    <>
      <span className="truncate max-w-[40%]">{fromLabel}</span>
      <span className="shrink-0 text-[var(--muted)]" aria-hidden>
        ⇄
      </span>
      <span className="truncate max-w-[40%]">{toLabel}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] touch-manipulation"
      >
        {content}
      </button>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium">
      {content}
    </span>
  );
}
