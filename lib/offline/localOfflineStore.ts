/**
 * Backward-compatible facade over the OfflinePackStore abstraction.
 * Web/PWA uses IndexedDB; tests use MemoryOfflinePackStore.
 */
import { getOfflinePackStore } from "@/lib/offline/getOfflinePackStore";
import {
  activateMemoryOfflinePackStoreForTests,
  clearOfflinePackStoreForTests,
} from "@/lib/offline/getOfflinePackStore";
import type {
  OfflineMissingRequest,
  OfflinePackEntry,
  OfflineRecentPair,
  OfflineRecentPhrase,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";
import { migrateOfflinePack } from "@/lib/offline/offlinePackMigration";
import type { SaveMissingRequestInput } from "@/lib/offline/offlinePackStore";
import type { AudioType } from "@/lib/schemas/enums";

function store() {
  return getOfflinePackStore();
}

export async function saveOfflinePack(pack: OfflineStoredPack): Promise<void> {
  return store().savePack(pack);
}

export async function getOfflinePackByKey(
  packKey: string,
): Promise<OfflineStoredPack | null> {
  const pack = await store().getPackByKey(packKey);
  if (!pack) return null;

  const result = migrateOfflinePack(pack);
  if (result.migrationApplied) {
    await store().savePack(result.pack);
  }
  return result.pack;
}

export async function listOfflinePacks(): Promise<OfflineStoredPack[]> {
  return store().listPacks();
}

export async function removeOfflinePack(packKey: string): Promise<boolean> {
  return store().removePack(packKey);
}

export async function recordRecentPhrase(
  input: Omit<OfflineRecentPhrase, "id">,
): Promise<void> {
  return store().recordRecentPhrase(input);
}

export async function recordRecentPair(input: OfflineRecentPair): Promise<void> {
  return store().recordRecentPair(input);
}

export async function getRecentPhrases(limit = 8): Promise<OfflineRecentPhrase[]> {
  return store().getRecentPhrases(limit);
}

export async function getRecentPairs(limit = 6): Promise<OfflineRecentPair[]> {
  return store().getRecentPairs(limit);
}

export async function addOfflineFavorite(
  entryId: string,
  packKey: string,
): Promise<void> {
  return store().addFavorite(entryId, packKey);
}

export async function removeOfflineFavorite(entryId: string): Promise<void> {
  return store().removeFavorite(entryId);
}

export async function listOfflineFavoriteEntryIds(
  packKey?: string,
): Promise<string[]> {
  return store().listFavoriteEntryIds(packKey);
}

export async function isOfflineFavorite(entryId: string): Promise<boolean> {
  return store().isFavorite(entryId);
}

export async function saveOfflineMissingRequest(
  input: SaveMissingRequestInput,
): Promise<OfflineMissingRequest> {
  return store().saveMissingRequest(input);
}

export async function listOfflineMissingRequests(
  packKey?: string,
): Promise<OfflineMissingRequest[]> {
  return store().listMissingRequests(packKey);
}

export async function updateOfflineMissingRequestStatus(
  id: string,
  patch: import("@/lib/offline/offlinePackStore").UpdateMissingRequestPatch,
): Promise<OfflineMissingRequest | null> {
  return store().updateMissingRequestStatus(id, patch);
}

export function resetLocalOfflineStoreForTests(): void {
  activateMemoryOfflinePackStoreForTests();
}

export function clearLocalOfflineStoreForTests(): void {
  clearOfflinePackStoreForTests();
}

export async function clearOfflineRecentHistory(): Promise<void> {
  const current = store();
  if (current.clearRecentHistory) {
    await current.clearRecentHistory();
    return;
  }
}

export async function clearOfflineMissingRequests(): Promise<void> {
  const current = store();
  if (current.clearMissingRequests) {
    await current.clearMissingRequests();
  }
}

export async function clearAllOfflineStoreData(): Promise<void> {
  const current = store();
  if (current.clearAllLocalData) {
    await current.clearAllLocalData();
  }
}

export function packEntryToLegacyPhrase(
  entry: OfflinePackEntry,
  dialectId?: string,
): {
  id: string;
  english: string;
  target_text: string;
  dialect_id: string;
  pronunciation_simple: string;
  category: OfflinePackEntry["category"];
  audio_type: AudioType;
  validation_status: OfflinePackEntry["validation_status"];
  confidence: { score: number; level: "high" | "medium" | "low" };
  is_mock_data: boolean;
} {
  const score = entry.confidence_score;
  return {
    id: entry.id,
    english: entry.source_text,
    target_text: entry.translated_text,
    dialect_id: dialectId ?? entry.voice_metadata?.dialect_id ?? "unknown",
    pronunciation_simple: entry.pronunciation_simple,
    category: entry.category,
    audio_type:
      entry.audio_type === "device_tts_fallback"
        ? "synthetic_tts"
        : entry.audio_type === "ai_generated"
          ? "cached_cloud_tts"
          : entry.audio_type === "native_recorded"
            ? "native_recorded"
            : "synthetic_tts",
    validation_status: entry.validation_status,
    confidence: {
      score,
      level: score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low",
    },
    is_mock_data: entry.source !== "curated",
  };
}
