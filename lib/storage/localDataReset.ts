import { ACTIVE_PAIR_STORAGE_KEY } from "@/lib/offline/offlinePackService";
import { removeOfflinePackAudio } from "@/lib/offline/offlineAudioCache";
import {
  ACTIVE_OFFLINE_PACK_STORAGE_KEY,
  ADMIN_OVERRIDES_STORAGE_KEY,
  CORRECTIONS_STORAGE_KEY,
  DOWNLOADED_PACKS_STORAGE_KEY,
  SAVED_WORDS_STORAGE_KEY,
} from "@/lib/storage/constants";
import {
  USER_PREFERENCES_STORAGE_KEY,
  notifyUserPreferencesUpdated,
} from "@/lib/settings/userPreferences";

const TRANSLATOR_SETTINGS_KEY = "lexienn_translator_settings";

function clearLocalStorageKeys(keys: string[]): void {
  if (typeof window === "undefined") return;
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export async function clearDownloadedOfflinePacks(): Promise<number> {
  const { listOfflinePacks, removeOfflinePack } = await import("@/lib/offline/localOfflineStore");
  const { removeOfflinePackDownloadProgress } = await import(
    "@/lib/offline/offlinePackDownloadProgress"
  );
  const packs = await listOfflinePacks();
  for (const pack of packs) {
    await removeOfflinePack(pack.pack_key);
    await removeOfflinePackDownloadProgress(pack.pack_key);
    if (typeof window !== "undefined") {
      await removeOfflinePackAudio(pack.pack_key);
    }
  }

  clearLocalStorageKeys([
    DOWNLOADED_PACKS_STORAGE_KEY,
    ACTIVE_OFFLINE_PACK_STORAGE_KEY,
    ACTIVE_PAIR_STORAGE_KEY,
  ]);

  return packs.length;
}

export async function clearRecentOfflineHistory(): Promise<void> {
  const { clearOfflineRecentHistory } = await import("@/lib/offline/localOfflineStore");
  await clearOfflineRecentHistory();
}

export async function clearSavedMissingRequests(): Promise<void> {
  const { clearOfflineMissingRequests } = await import("@/lib/offline/localOfflineStore");
  await clearOfflineMissingRequests();
}

export async function resetLexiennLocalData(): Promise<void> {
  const { clearAllOfflineStoreData } = await import("@/lib/offline/localOfflineStore");
  await clearAllOfflineStoreData();

  clearLocalStorageKeys([
    USER_PREFERENCES_STORAGE_KEY,
    TRANSLATOR_SETTINGS_KEY,
    SAVED_WORDS_STORAGE_KEY,
    DOWNLOADED_PACKS_STORAGE_KEY,
    ACTIVE_OFFLINE_PACK_STORAGE_KEY,
    ACTIVE_PAIR_STORAGE_KEY,
    CORRECTIONS_STORAGE_KEY,
    ADMIN_OVERRIDES_STORAGE_KEY,
  ]);

  notifyUserPreferencesUpdated();
}
