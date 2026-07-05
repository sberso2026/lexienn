import type { ReactNode } from "react";

type AlertVariant = "info" | "warning" | "error" | "success";

interface AlertCardProps {
  children: ReactNode;
  title?: string;
  variant?: AlertVariant;
}

const variantClasses: Record<AlertVariant, string> = {
  info: "border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)]",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  error:
    "border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
};

export function AlertCard({
  children,
  title,
  variant = "info",
}: AlertCardProps) {
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "note"}
      className={`rounded-xl border px-4 py-3 text-sm ${variantClasses[variant]}`}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
