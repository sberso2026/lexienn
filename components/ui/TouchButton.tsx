"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TOUCH_MIN, TOUCH_PRESSED, TOUCH_PRIMARY } from "@/lib/ui/touchTargets";

type TouchButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: TouchButtonVariant;
  fullWidth?: boolean;
  /** Primary mobile CTA height (56px). Default for variant=primary. */
  primarySize?: boolean;
}

const variantClasses: Record<TouchButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] border border-transparent disabled:bg-[var(--accent)]/40 disabled:text-white/90",
  secondary:
    "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] hover:bg-[var(--background)] disabled:opacity-60",
  ghost:
    "bg-transparent text-[var(--foreground)] border border-transparent hover:bg-[var(--background)] disabled:opacity-60",
  danger:
    "bg-[var(--badge-danger)] text-white border border-transparent hover:opacity-90 disabled:opacity-60",
};

/** Large-tap ActionButton pattern for mobile-first controls. */
export function TouchButton({
  children,
  variant = "primary",
  fullWidth = false,
  primarySize,
  className = "",
  type = "button",
  ...props
}: TouchButtonProps) {
  const usePrimary = primarySize ?? variant === "primary";
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed ${TOUCH_PRESSED} ${usePrimary ? TOUCH_PRIMARY : TOUCH_MIN} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface IconTouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  size?: "md" | "lg" | "mic";
  active?: boolean;
}

/** Icon-only control with ≥48px (mic ≥56px) tap area. */
export function IconTouchButton({
  icon,
  label,
  size = "md",
  active = false,
  className = "",
  ...props
}: IconTouchButtonProps) {
  const sizeClass =
    size === "mic"
      ? "h-14 w-14 min-h-14 min-w-14"
      : size === "lg"
        ? "h-14 w-14 min-h-14 min-w-14"
        : "h-12 w-12 min-h-12 min-w-12";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50 ${TOUCH_PRESSED} ${sizeClass} ${active ? "ring-2 ring-[var(--focus-ring)] ring-offset-1" : ""} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}

interface PrimaryActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
}

export function PrimaryActionButton({
  children,
  fullWidth = true,
  className = "",
  type = "button",
  ...props
}: PrimaryActionButtonProps) {
  return (
    <TouchButton
      type={type}
      variant="primary"
      primarySize
      fullWidth={fullWidth}
      className={className}
      {...props}
    >
      {children}
    </TouchButton>
  );
}

interface ActionPillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  selected?: boolean;
}

export function ActionPillButton({
  children,
  selected = false,
  className = "",
  type = "button",
  ...props
}: ActionPillButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl border px-3 text-xs font-semibold ${TOUCH_PRESSED} ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
