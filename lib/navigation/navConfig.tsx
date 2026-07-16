import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: ReactNode;
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/dictionary",
    label: "Define",
    shortLabel: "Define",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
      </svg>
    ),
  },
  {
    href: "/translator",
    label: "Translate",
    shortLabel: "Translate",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h8M17 8l2 2-2 2M7 16l-2-2 2-2" />
      </svg>
    ),
  },
  {
    href: "/lens",
    label: "Lens",
    shortLabel: "Lens",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8v6H8z" />
      </svg>
    ),
  },
  {
    href: "/library",
    label: "Library",
    shortLabel: "Library",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 4.5A2.5 2.5 0 017.5 2H20v18H7.5A2.5 2.5 0 005 22V4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 18.5A2.5 2.5 0 017.5 16H20" />
      </svg>
    ),
  },
  {
    href: "/more",
    label: "More",
    shortLabel: "More",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
      </svg>
    ),
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dictionary") return pathname.startsWith("/dictionary");
  if (href === "/library") {
    return (
      pathname.startsWith("/library") ||
      pathname.startsWith("/offline") ||
      pathname.startsWith("/phrase-packs")
    );
  }
  if (href === "/more") {
    return pathname.startsWith("/more") || pathname.startsWith("/settings");
  }
  return pathname.startsWith(href);
}

export const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/dictionary": "Define",
  "/translator": "Translate",
  "/lens": "Lens",
  "/library": "Library",
  "/more": "More",
  "/offline": "Offline",
  "/phrase-packs": "Profession Packs",
  "/settings": "Settings",
};

export function getPageTitle(pathname: string): string {
  if (pathname === "/") return PAGE_TITLES["/"];
  if (pathname.startsWith("/dictionary/result")) return "Result";
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) return title;
  }
  return "Lexienn";
}
