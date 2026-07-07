"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface BottomActionBarProps {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
}

const MOBILE_CHROME_ROOT_ID = "mobile-app-chrome-root";

function ActionBarContent({
  children,
  ariaLabel,
  className,
  mobile,
}: BottomActionBarProps & { mobile: boolean }) {
  if (mobile) {
    return (
      <div
        role="toolbar"
        aria-label={ariaLabel}
        className={`result-action-bar-shell ${className}`}
      >
        <div className="result-action-bar-buttons">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={`mt-3 border-t border-[var(--card-border)] pt-2 md:border-0 md:pt-0 ${className}`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around gap-1 sm:max-w-2xl lg:max-w-3xl">
        {children}
      </div>
    </div>
  );
}

export function BottomActionBar({
  children,
  ariaLabel,
  className = "",
}: BottomActionBarProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [useMobileChrome, setUseMobileChrome] = useState(false);

  useEffect(() => {
    setPortalRoot(document.getElementById(MOBILE_CHROME_ROOT_ID));

    const media = window.matchMedia("(max-width: 767px)");
    const syncLayout = () => setUseMobileChrome(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  const content = (
    <ActionBarContent ariaLabel={ariaLabel} className={className} mobile={useMobileChrome}>
      {children}
    </ActionBarContent>
  );

  if (useMobileChrome && portalRoot) {
    return createPortal(content, portalRoot);
  }

  if (useMobileChrome) {
    return null;
  }

  return content;
}
