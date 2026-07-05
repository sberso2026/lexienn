import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function FormField({
  id,
  label,
  children,
  hint,
  error,
  required,
}: FormFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--badge-danger)]">*</span>}
      </label>
      <div className="mt-1.5" aria-describedby={describedBy || undefined}>
        {children}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[var(--muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm text-[var(--badge-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldInputClassName(hasError = false) {
  return `w-full min-h-11 rounded-xl border bg-[var(--card)] px-3.5 py-2.5 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] ${
    hasError
      ? "border-[var(--badge-danger)]"
      : "border-[var(--card-border)] focus:border-[var(--accent-indigo)]"
  }`;
}
