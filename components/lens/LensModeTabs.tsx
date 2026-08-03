"use client";

import { LENS_MODES, type LensMode } from "@/lib/lens/lensTypes";

type LensModeTabsProps = {
  mode: LensMode;
  onChange: (mode: LensMode) => void;
};

export function LensModeTabs({ mode, onChange }: LensModeTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Lens modes">
      {LENS_MODES.map((item) => {
        const active = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex min-h-16 flex-col justify-center rounded-xl border px-2 py-2 text-left ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            <span className="text-xs font-semibold">{item.label}</span>
            <span className={`mt-0.5 text-[10px] ${active ? "text-white/70" : ""}`}>
              {item.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
