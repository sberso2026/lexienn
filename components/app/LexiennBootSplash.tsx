"use client";

import { LexiennBrandLogo } from "@/components/brand/LexiennBrandLogo";

export function LexiennBootSplash({ message = "Opening Lexienn…" }: { message?: string }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[55] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1a3f6b_0%,#0b1f38_70%)] px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center text-white"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <LexiennBrandLogo size="install" className="opacity-95" priority />
      <p className="mt-4 text-sm text-slate-200">{message}</p>
    </div>
  );
}
