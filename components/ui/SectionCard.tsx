import type { ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: "normal" | "compact";
}

export function SectionCard({
  children,
  title,
  subtitle,
  className = "",
  padding = "normal",
}: SectionCardProps) {
  const paddingClass = padding === "compact" ? "p-4" : "p-4 sm:p-5";

  return (
    <article className={`card-surface ${paddingClass} ${className}`}>
      {(title || subtitle) && (
        <header className={title ? "mb-4" : "mb-2"}>
          {title && (
            <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </article>
  );
}

/** @deprecated Use SectionCard — kept for gradual migration */
export { SectionCard as FeatureCard };
