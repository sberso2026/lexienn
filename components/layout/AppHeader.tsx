interface AppHeaderProps {
  subtitle?: string;
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Lexienn
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--foreground)] sm:text-xl">
            {subtitle ?? "Dictionary & Voice"}
          </h1>
        </div>
        <div
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-indigo)] sm:flex"
          aria-hidden
        >
          L
        </div>
      </div>
    </header>
  );
}
