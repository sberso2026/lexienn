import type { ReactNode } from "react";

type CompactAlertVariant = "info" | "warning" | "error" | "success";

interface CompactAlertProps {
  children: ReactNode;
  variant?: CompactAlertVariant;
  icon?: ReactNode;
}

const variantClasses: Record<CompactAlertVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
  success: "border-green-200 bg-green-50 text-green-900",
};

export function CompactAlert({
  children,
  variant = "info",
  icon,
}: CompactAlertProps) {
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "note"}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed ${variantClasses[variant]}`}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
