import type { OfflinePackGenerateRequest } from "@/lib/offline/offlinePackSchemas";

export type OfflinePackDownloadPhase =
  | "idle"
  | "preparing"
  | "downloading_text"
  | "downloading_audio"
  | "saving"
  | "verifying"
  | "downloaded"
  | "failed"
  | "cancelled"
  | "paused";

export type PackDownloadErrorCode =
  | "storage_quota_exceeded"
  | "network_error"
  | "audio_failed"
  | "unsupported_storage"
  | "server_timeout"
  | "verification_failed"
  | "indexeddb_write_failed"
  | "cancelled";

export type OfflinePackDownloadProgressRecord = {
  pack_key: string;
  source_language: string;
  target_language: string;
  category: string;
  total_items: number;
  completed_items: number;
  audio_completed_items: number;
  status: OfflinePackDownloadPhase;
  updated_at: string;
  error_code?: PackDownloadErrorCode;
  error_message?: string;
  include_audio: boolean;
  request?: OfflinePackGenerateRequest;
};

export type PackDownloadSnapshot = {
  phase: OfflinePackDownloadPhase;
  progressPercent: number;
  completedItems: number;
  audioCompletedItems: number;
  totalItems: number;
  message: string;
  errorCode?: PackDownloadErrorCode;
};

export const TEXT_SAVE_BATCH_SIZE = 15;
export const PACK_FETCH_TIMEOUT_MS = 120_000;
export const MIN_FREE_STORAGE_BYTES = 3 * 1024 * 1024;

export const PACK_DOWNLOAD_ERROR_MESSAGES: Record<PackDownloadErrorCode, string> = {
  storage_quota_exceeded: "Not enough device storage for this pack.",
  network_error: "Connection interrupted. Tap Resume.",
  audio_failed: "Text downloaded. Audio can be retried.",
  unsupported_storage:
    "Offline packs are limited in this browser. Open Lexienn from the Home Screen app.",
  server_timeout: "Pack generation took too long. Try a smaller pack or retry.",
  verification_failed: "Pack verification failed. Tap Retry to finish downloading.",
  indexeddb_write_failed: "Could not save pack on this device. Free storage and retry.",
  cancelled: "Download cancelled. Tap Download to resume.",
};

export function mapPackDownloadErrorMessage(
  code: PackDownloadErrorCode | undefined,
  fallback?: string,
): string {
  if (code && PACK_DOWNLOAD_ERROR_MESSAGES[code]) {
    return PACK_DOWNLOAD_ERROR_MESSAGES[code];
  }
  return fallback ?? "Could not download offline pack.";
}

export function buildPackDownloadSnapshot(
  record: Pick<
    OfflinePackDownloadProgressRecord,
    | "status"
    | "completed_items"
    | "audio_completed_items"
    | "total_items"
    | "error_code"
    | "error_message"
    | "include_audio"
  >,
  message?: string,
): PackDownloadSnapshot {
  const textWeight = record.include_audio ? 60 : 100;
  const audioWeight = record.include_audio ? 40 : 0;
  const textPercent =
    record.total_items > 0
      ? (record.completed_items / record.total_items) * textWeight
      : 0;
  const audioPercent =
    record.include_audio && record.total_items > 0
      ? (record.audio_completed_items / record.total_items) * audioWeight
      : 0;
  const progressPercent = Math.min(
    100,
    Math.round(textPercent + audioPercent),
  );

  return {
    phase: record.status,
    progressPercent,
    completedItems: record.completed_items,
    audioCompletedItems: record.audio_completed_items,
    totalItems: record.total_items,
    message:
      message ??
      record.error_message ??
      mapPackDownloadErrorMessage(record.error_code),
    errorCode: record.error_code,
  };
}
