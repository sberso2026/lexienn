"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  variant?: "success" | "info";
  onDismiss: () => void;
  autoDismissMs?: number;
}

const variantClasses = {
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  info: "border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)]",
};

export function Toast({
  message,
  variant = "success",
  onDismiss,
  autoDismissMs = 4500,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, message, onDismiss]);

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${variantClasses[variant]}`}
      >
        <span className="font-semibold">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs font-medium opacity-70 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
