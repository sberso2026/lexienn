type StatusChipVariant = "neutral" | "success" | "warning" | "error" | "info" | "accent";

interface StatusChipProps {
  label: string;
  variant?: StatusChipVariant;
  icon?: React.ReactNode;
}

const variantClasses: Record<StatusChipVariant, string> = {
  neutral: "bg-[var(--background)] text-[var(--muted)] border-[var(--card-border)]",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-800 border-red-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--card-border)]",
};

export function StatusChip({ label, variant = "neutral", icon }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${variantClasses[variant]}`}
    >
      {icon}
      {label}
    </span>
  );
}
