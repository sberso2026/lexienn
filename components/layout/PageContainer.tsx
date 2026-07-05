import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  /** Hide default page header when page provides its own hero */
  hideHeader?: boolean;
}

export function PageContainer({
  children,
  title,
  description,
  hideHeader = false,
}: PageContainerProps) {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-lg px-4 py-3 sm:max-w-2xl sm:px-6 sm:py-5 lg:max-w-3xl"
    >
      {!hideHeader && (title || description) && (
        <header className="mb-5 sm:mb-6">
          {title && (
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          )}
        </header>
      )}
      {children}
    </main>
  );
}
