interface LanguageBadgeProps {
  language: string;
  dialect?: string;
}

export function LanguageBadge({ language, dialect }: LanguageBadgeProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-indigo)]">
        {language}
      </span>
      {dialect && (
        <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {dialect}
        </span>
      )}
    </span>
  );
}
