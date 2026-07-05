import type { ReactNode } from "react";

interface BottomActionBarProps {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
}

export function BottomActionBar({
  children,
  ariaLabel,
  className = "",
}: BottomActionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={`fixed inset-x-0 bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom,0px))] z-40 border-t border-[var(--card-border)] bg-[var(--card)]/95 p-2 backdrop-blur-md md:static md:mt-3 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none ${className}`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around gap-1 sm:max-w-2xl lg:max-w-3xl">
        {children}
      </div>
    </div>
  );
}
