"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonVariant = "default" | "primary" | "ghost" | "danger";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default:
    "border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--background)]",
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  ghost: "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
};

const sizeClasses = {
  sm: "h-9 w-9 min-h-9 min-w-9",
  md: "h-11 w-11 min-h-11 min-w-11",
  lg: "h-12 w-12 min-h-12 min-w-12",
};

export function IconButton({
  icon,
  label,
  variant = "default",
  size = "md",
  active = false,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl transition-colors touch-manipulation disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${active ? "ring-2 ring-[var(--focus-ring)] ring-offset-1" : ""} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
