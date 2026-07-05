type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "info"
  /** @deprecated use neutral */
  | "coming-soon"
  /** @deprecated use success */
  | "offline"
  /** @deprecated use accent */
  | "beta";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  accent: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
  success: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  warning: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  info: "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  "coming-soon": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",  offline: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  beta: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
};

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}

/** @deprecated Use Badge */
export function StatusBadge({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: BadgeVariant;
}) {
  return <Badge label={label} variant={variant} />;
}
