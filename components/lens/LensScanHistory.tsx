"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import {
  clearLensScanHistory,
  loadLensScanHistory,
  LENS_SCAN_HISTORY_UPDATED_EVENT,
} from "@/lib/lens/lensScanHistory";
import type { LensScanHistoryItem } from "@/lib/lens/lensTypes";

type LensScanHistoryProps = {
  onReuse?: (item: LensScanHistoryItem) => void;
};

export function LensScanHistory({ onReuse }: LensScanHistoryProps) {
  const [items, setItems] = useState<LensScanHistoryItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(loadLensScanHistory());
    refresh();
    window.addEventListener(LENS_SCAN_HISTORY_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LENS_SCAN_HISTORY_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (items.length === 0) {
    return (
      <CompactCard padding="sm">
        <p className="text-sm font-semibold">Scan History</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          Recent Lens scans appear here after you save a translation to Library or history.
        </p>
      </CompactCard>
    );
  }

  return (
    <CompactCard padding="sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Scan History</p>
        <ActionButton
          type="button"
          variant="ghost"
          className="!min-h-10"
          onClick={() => {
            clearLensScanHistory();
            setItems([]);
          }}
        >
          Clear
        </ActionButton>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2"
          >
            <p className="text-sm font-medium leading-snug line-clamp-2">
              {item.translatedText || item.originalText}
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)] line-clamp-2">
              {item.originalText}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[var(--muted)]">
                {new Date(item.createdAt).toLocaleString()}
              </span>
              {onReuse && (
                <ActionButton
                  type="button"
                  variant="secondary"
                  className="!min-h-10"
                  onClick={() => onReuse(item)}
                >
                  Reuse
                </ActionButton>
              )}
            </div>
          </li>
        ))}
      </ul>
    </CompactCard>
  );
}
