"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { IconButton } from "@/components/ui/IconButton";
import { InfoSheet } from "@/components/ui/InfoSheet";

export type OfflineBannerState =
  | "no_pair_selected"
  | "no_pack_selected"
  | "pack_downloaded"
  | "pack_missing"
  | "update_available"
  | "text_ready"
  | "audio_downloading";

interface OfflineStatusBannerProps {
  isOnline: boolean;
  packState: OfflineBannerState;
  pairLabel?: string;
  textCoverageLabel?: string;
  audioCoverageLabel?: string;
  packTierLabel?: string;
  lastUpdatedLabel?: string;
  availabilityMessage?: string;
  storageWarning?: string;
  actionMessage?: string | null;
}

const PACK_STATE_LABELS: Record<OfflineBannerState, string> = {
  no_pair_selected: "Select pair",
  no_pack_selected: "No pack",
  pack_downloaded: "Ready",
  pack_missing: "Missing",
  update_available: "Update available",
  text_ready: "Text ready",
  audio_downloading: "Audio…",
};

const PACK_STATE_VARIANT: Record<
  OfflineBannerState,
  "neutral" | "success" | "warning" | "info"
> = {
  no_pair_selected: "neutral",
  no_pack_selected: "neutral",
  pack_downloaded: "success",
  pack_missing: "warning",
  update_available: "info",
  text_ready: "info",
  audio_downloading: "info",
};

export function OfflineStatusBanner({
  isOnline,
  packState,
  pairLabel,
  textCoverageLabel,
  audioCoverageLabel,
  packTierLabel,
  storageWarning,
  actionMessage,
}: OfflineStatusBannerProps) {
  const [showStorageInfo, setShowStorageInfo] = useState(false);

  return (
    <>
      <div className="card-surface space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusChip
            label={isOnline ? "Online" : "Offline"}
            variant={isOnline ? "success" : "warning"}
          />
          <StatusChip
            label={PACK_STATE_LABELS[packState]}
            variant={PACK_STATE_VARIANT[packState]}
          />
          {pairLabel && <StatusChip label={pairLabel} variant="neutral" />}
          {packTierLabel && <StatusChip label={packTierLabel} variant="neutral" />}
          {textCoverageLabel && <StatusChip label={textCoverageLabel} variant="info" />}
          {audioCoverageLabel && <StatusChip label={audioCoverageLabel} variant="info" />}
          {storageWarning && (
            <IconButton
              icon={
                <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              }
              label="Storage warning"
              variant="ghost"
              size="sm"
              onClick={() => setShowStorageInfo(true)}
            />
          )}
        </div>
        {actionMessage && (
          <p className="text-xs text-[var(--foreground)]" role="status">
            {actionMessage}
          </p>
        )}
      </div>

      <InfoSheet
        open={showStorageInfo}
        title="Storage"
        onClose={() => setShowStorageInfo(false)}
      >
        {storageWarning}
      </InfoSheet>
    </>
  );
}
