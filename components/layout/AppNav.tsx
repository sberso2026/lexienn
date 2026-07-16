"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, MAIN_NAV_ITEMS } from "@/lib/navigation/navConfig";

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="border-b border-[var(--card-border)] bg-[var(--card)]"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <ul className="flex gap-1 py-1.5">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
