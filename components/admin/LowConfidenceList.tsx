"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ValidationStatusBadge } from "@/components/ui/ValidationStatusBadge";
import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/admin/constants";
import {
  collectLowConfidenceItems,
  type LowConfidenceItem,
} from "@/lib/admin/lowConfidence";
import { DEV_LABELS } from "@/lib/ui/developerLabels";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";

function kindLabel(kind: LowConfidenceItem["kind"]): string {
  if (kind === "dictionary") return "Dictionary";
  if (kind === "dialect") return "Dialect";
  return "Offline phrase";
}

export function LowConfidenceList() {
  const [items, setItems] = useState<LowConfidenceItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    setItems(collectLowConfidenceItems());
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!loaded) {
    return (
      <FeatureCard title="Low-confidence entries">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </FeatureCard>
    );
  }

  return (
    <FeatureCard title="Low-confidence entries">
      <p className="text-sm text-[var(--muted)]">
        Seed entries with confidence below {Math.round(LOW_CONFIDENCE_THRESHOLD * 100)}%
        or marked uncertain. Native speaker validation recommended.
      </p>
      <div className="mt-3">
        <StatusBadge
          label={`${items.length} flagged`}
          variant={items.length > 0 ? "warning" : "success"}
        />
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No low-confidence entries"
            description="All tracked seed items meet the current confidence threshold."
          />
        </div>
      ) : (
        <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-[var(--muted)]">{item.detail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={kindLabel(item.kind)} variant="coming-soon" />
                  <ConfidenceBadge score={item.confidence} />
                  <ValidationStatusBadge status={item.validation_status} />
                  {item.is_mock_data && (
                    <StatusBadge label={DEV_LABELS.seedData} variant="warning" />
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Status: {formatEnumLabel(item.validation_status)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </FeatureCard>
  );
}
