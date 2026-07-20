import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ActionButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] border border-transparent",
  secondary:
    "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] hover:bg-[var(--background)]",
  ghost:
    "bg-transparent text-[var(--foreground)] border border-transparent hover:bg-[var(--background)]",
  danger:
    "bg-[var(--badge-danger)] text-white border border-transparent hover:opacity-90",
};

export function ActionButton({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors touch-manipulation active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variant === "primary" ? "min-h-14" : ""} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
