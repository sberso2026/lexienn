"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, MAIN_NAV_ITEMS } from "@/lib/navigation/navConfig";

export const MobileBottomNav = memo(function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="mobile-bottom-nav border-t border-[var(--card-border)] bg-[var(--card)]/98 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pt-0.5">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-semibold transition-colors touch-manipulation ${
                  isActive
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={isActive ? "scale-105" : ""}>{item.icon}</span>
                <span className="truncate">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
