"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import type { PackDownloadSnapshot } from "@/lib/offline/offlinePackDownloadTypes";
import { mapPackDownloadErrorMessage } from "@/lib/offline/offlinePackDownloadTypes";

interface OfflinePackDownloadPanelProps {
  snapshot: PackDownloadSnapshot;
  isRunning: boolean;
  isOnline: boolean;
  canRetryAudio: boolean;
  onCancel: () => void;
  onResume: () => void;
  onRetry: () => void;
  onRetryAudio: () => void;
}

const PHASE_LABELS: Record<PackDownloadSnapshot["phase"], string> = {
  idle: "Ready",
  preparing: "Preparing",
  downloading_text: "Downloading text",
  downloading_audio: "Downloading audio",
  saving: "Saving",
  verifying: "Verifying",
  downloaded: "Downloaded",
  failed: "Failed",
  cancelled: "Cancelled",
  paused: "Paused",
};

export function OfflinePackDownloadPanel({
  snapshot,
  isRunning,
  isOnline,
  canRetryAudio,
  onCancel,
  onResume,
  onRetry,
  onRetryAudio,
}: OfflinePackDownloadPanelProps) {
  if (snapshot.phase === "idle" && !isRunning) {
    return null;
  }

  const statusLabel = PHASE_LABELS[snapshot.phase] ?? snapshot.phase;
  const showCancel =
    isRunning ||
    snapshot.phase === "preparing" ||
    snapshot.phase === "downloading_text" ||
    snapshot.phase === "downloading_audio" ||
    snapshot.phase === "saving" ||
    snapshot.phase === "verifying";
  const showResume =
    !isRunning &&
    (snapshot.phase === "paused" ||
      snapshot.phase === "failed" ||
      snapshot.phase === "cancelled");
  const showRetry = !isRunning && snapshot.phase === "failed";
  const message =
    snapshot.message ||
    (snapshot.errorCode
      ? mapPackDownloadErrorMessage(snapshot.errorCode)
      : statusLabel);

  return (
    <div
      className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3"
      data-testid="offline-pack-download-panel"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{statusLabel}</p>
        <p className="text-sm text-[var(--muted)]">{snapshot.progressPercent}%</p>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--card-border)]"
        role="progressbar"
        aria-valuenow={snapshot.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${snapshot.progressPercent}%` }}
        />
      </div>

      <div className="grid gap-1 text-xs text-[var(--muted)] sm:grid-cols-2">
        <p>
          Phrases: {snapshot.completedItems}
          {snapshot.totalItems > 0 ? ` / ${snapshot.totalItems}` : ""}
        </p>
        <p>
          Audio files: {snapshot.audioCompletedItems}
          {snapshot.totalItems > 0 ? ` / ${snapshot.totalItems}` : ""}
        </p>
      </div>

      <p className="text-sm text-[var(--foreground)]" role="status">
        {!isOnline && isRunning ? "Waiting for connection" : message}
      </p>

      <div className="flex flex-wrap gap-2">
        {showCancel && (
          <ActionButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </ActionButton>
        )}
        {showResume && (
          <ActionButton type="button" variant="primary" onClick={onResume} disabled={!isOnline}>
            Resume
          </ActionButton>
        )}
        {showRetry && (
          <ActionButton type="button" variant="primary" onClick={onRetry} disabled={!isOnline}>
            Retry
          </ActionButton>
        )}
        {canRetryAudio && !isRunning && (
          <ActionButton type="button" variant="secondary" onClick={onRetryAudio} disabled={!isOnline}>
            Retry audio
          </ActionButton>
        )}
      </div>
    </div>
  );
}
