import { runOfflineTransaction } from "@/lib/offline/offlineIndexedDb";
import type {
  OfflinePackDownloadPhase,
  OfflinePackDownloadProgressRecord,
  PackDownloadErrorCode,
} from "@/lib/offline/offlinePackDownloadTypes";
import type { OfflinePackGenerateRequest, OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";

const memoryProgress = new Map<string, OfflinePackDownloadProgressRecord>();
const memoryBuffers = new Map<string, OfflineStoredPack>();

function shouldUseMemoryStore(): boolean {
  return typeof indexedDB === "undefined";
}

export async function getOfflinePackDownloadProgress(
  packKey: string,
): Promise<OfflinePackDownloadProgressRecord | null> {
  if (shouldUseMemoryStore()) {
    return memoryProgress.get(packKey) ?? null;
  }

  const result = await runOfflineTransaction<OfflinePackDownloadProgressRecord | undefined>(
    "offline_pack_download_progress",
    "readonly",
    (store) => store.get(packKey),
  );
  return result ?? null;
}

export async function saveOfflinePackDownloadProgress(
  record: OfflinePackDownloadProgressRecord,
): Promise<void> {
  if (shouldUseMemoryStore()) {
    memoryProgress.set(record.pack_key, record);
    return;
  }

  await runOfflineTransaction("offline_pack_download_progress", "readwrite", (store) =>
    store.put(record),
  );
}

export async function removeOfflinePackDownloadProgress(packKey: string): Promise<void> {
  if (shouldUseMemoryStore()) {
    memoryProgress.delete(packKey);
    memoryBuffers.delete(packKey);
    return;
  }

  await runOfflineTransaction("offline_pack_download_progress", "readwrite", (store) =>
    store.delete(packKey),
  );
  await runOfflineTransaction("offline_pack_download_buffer", "readwrite", (store) =>
    store.delete(packKey),
  );
}

export async function saveOfflinePackDownloadBuffer(
  packKey: string,
  pack: OfflineStoredPack,
): Promise<void> {
  if (shouldUseMemoryStore()) {
    memoryBuffers.set(packKey, pack);
    return;
  }

  await runOfflineTransaction("offline_pack_download_buffer", "readwrite", (store) =>
    store.put({ pack_key: packKey, pack }),
  );
}

export async function getOfflinePackDownloadBuffer(
  packKey: string,
): Promise<OfflineStoredPack | null> {
  if (shouldUseMemoryStore()) {
    return memoryBuffers.get(packKey) ?? null;
  }

  const result = await runOfflineTransaction<{ pack: OfflineStoredPack } | undefined>(
    "offline_pack_download_buffer",
    "readonly",
    (store) => store.get(packKey),
  );
  return result?.pack ?? null;
}

export async function clearOfflinePackDownloadBuffer(packKey: string): Promise<void> {
  if (shouldUseMemoryStore()) {
    memoryBuffers.delete(packKey);
    return;
  }

  await runOfflineTransaction("offline_pack_download_buffer", "readwrite", (store) =>
    store.delete(packKey),
  );
}

export function clearOfflinePackDownloadProgressForTests(): void {
  memoryProgress.clear();
  memoryBuffers.clear();
}

export function createInitialDownloadProgress(input: {
  packKey: string;
  sourceLanguage: string;
  targetLanguage: string;
  category: string;
  totalItems: number;
  request: OfflinePackGenerateRequest;
  includeAudio: boolean;
}): OfflinePackDownloadProgressRecord {
  return {
    pack_key: input.packKey,
    source_language: input.sourceLanguage,
    target_language: input.targetLanguage,
    category: input.category,
    total_items: input.totalItems,
    completed_items: 0,
    audio_completed_items: 0,
    status: "preparing",
    updated_at: new Date().toISOString(),
    include_audio: input.includeAudio,
    request: input.request,
  };
}

export async function patchOfflinePackDownloadProgress(
  packKey: string,
  patch: Partial<
    Pick<
      OfflinePackDownloadProgressRecord,
      | "status"
      | "completed_items"
      | "audio_completed_items"
      | "error_code"
      | "error_message"
      | "total_items"
    >
  >,
): Promise<OfflinePackDownloadProgressRecord | null> {
  const existing = await getOfflinePackDownloadProgress(packKey);
  if (!existing) return null;

  const next: OfflinePackDownloadProgressRecord = {
    ...existing,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  await saveOfflinePackDownloadProgress(next);
  return next;
}

export function isResumableDownloadStatus(
  status: OfflinePackDownloadPhase,
): boolean {
  return (
    status === "paused" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "downloading_text" ||
    status === "downloading_audio" ||
    status === "preparing"
  );
}

export function isActiveDownloadStatus(status: OfflinePackDownloadPhase): boolean {
  return (
    status === "preparing" ||
    status === "downloading_text" ||
    status === "downloading_audio" ||
    status === "saving" ||
    status === "verifying"
  );
}

export function toDownloadErrorCode(
  error: unknown,
  fallback: PackDownloadErrorCode = "network_error",
): PackDownloadErrorCode {
  if (error instanceof Error) {
    const tagged = (error as Error & { code?: PackDownloadErrorCode }).code;
    if (tagged) return tagged;
    if (/quota|storage/i.test(error.message)) return "storage_quota_exceeded";
    if (/timeout/i.test(error.message)) return "server_timeout";
    if (/indexeddb|idb/i.test(error.message)) return "indexeddb_write_failed";
    if (/unsupported|security/i.test(error.message)) return "unsupported_storage";
  }
  return fallback;
}
