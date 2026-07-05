import type { OfflinePackStore } from "@/lib/offline/offlinePackStore";

/**
 * Future native mobile SQLite adapter stub.
 * Not implemented in the web/PWA runtime — use IndexedDB instead.
 */
export class SqliteOfflinePackStore implements OfflinePackStore {
  savePack(): Promise<void> {
    return Promise.reject(
      new Error(
        "SQLite offline storage is not implemented in the web runtime. Use IndexedDBOfflinePackStore.",
      ),
    );
  }

  getPackByKey(): Promise<null> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  listPacks(): Promise<never[]> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  removePack(): Promise<boolean> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  recordRecentPhrase(): Promise<void> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  recordRecentPair(): Promise<void> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  getRecentPhrases(): Promise<never[]> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  getRecentPairs(): Promise<never[]> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  addFavorite(): Promise<void> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  removeFavorite(): Promise<void> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  listFavoriteEntryIds(): Promise<never[]> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  isFavorite(): Promise<boolean> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  saveMissingRequest(): Promise<never> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  listMissingRequests(): Promise<never[]> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }

  updateMissingRequestStatus(): Promise<null> {
    return Promise.reject(new Error("SQLite offline storage is not implemented."));
  }
}

export const sqliteOfflinePackStore = new SqliteOfflinePackStore();
