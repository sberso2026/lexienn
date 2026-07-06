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
    label: "Home",
    shortLabel: "Home",
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
    href: "/offline",
    label: "Offline",
    shortLabel: "Offline",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  },
  {
    href: "/phrase-packs",
    label: "Packs",
    shortLabel: "Packs",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h4c2 0 3 1 3 3M4 7h16M8 11h8" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: (
      <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dictionary") return pathname.startsWith("/dictionary");
  if (href === "/settings") return pathname.startsWith("/settings");
  return pathname.startsWith(href);
}

export const PAGE_TITLES: Record<string, string> = {
  "/dictionary": "Define",
  "/translator": "Translate",
  "/offline": "Offline",
  "/phrase-packs": "Packs",
  "/settings": "Settings",
};

export function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/dictionary/result")) return "Result";
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) return title;
  }
  return "Lexienn";
}
