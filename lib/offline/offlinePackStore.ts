import type {
  OfflineMissingRequest,
  OfflineRecentPair,
  OfflineRecentPhrase,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";

export type SaveMissingRequestInput = {
  from_language_id: string;
  to_language_id: string;
  pack_key: string;
  requested_text: string;
  user_context: string;
  request_type?: import("@/lib/offline/offlinePackSchemas").OfflineMissingRequestType;
};

export type UpdateMissingRequestPatch = Partial<
  Pick<
    OfflineMissingRequest,
    | "status"
    | "synced_at"
    | "translated_text"
    | "pronunciation_simple"
    | "usage_note"
    | "translation_source"
    | "pack_entry_id"
  >
>;

/** Local-first storage contract for offline packs (IndexedDB, SQLite stub, memory). */
export interface OfflinePackStore {
  savePack(pack: OfflineStoredPack): Promise<void>;
  getPackByKey(packKey: string): Promise<OfflineStoredPack | null>;
  listPacks(): Promise<OfflineStoredPack[]>;
  removePack(packKey: string): Promise<boolean>;

  recordRecentPhrase(input: Omit<OfflineRecentPhrase, "id">): Promise<void>;
  recordRecentPair(input: OfflineRecentPair): Promise<void>;
  getRecentPhrases(limit?: number): Promise<OfflineRecentPhrase[]>;
  getRecentPairs(limit?: number): Promise<OfflineRecentPair[]>;

  addFavorite(entryId: string, packKey: string): Promise<void>;
  removeFavorite(entryId: string): Promise<void>;
  listFavoriteEntryIds(packKey?: string): Promise<string[]>;
  isFavorite(entryId: string): Promise<boolean>;

  saveMissingRequest(input: SaveMissingRequestInput): Promise<OfflineMissingRequest>;
  listMissingRequests(packKey?: string): Promise<OfflineMissingRequest[]>;
  updateMissingRequestStatus(
    id: string,
    patch: UpdateMissingRequestPatch,
  ): Promise<OfflineMissingRequest | null>;

  /** Test-only reset when implemented. */
  resetForTests?(): void;

  clearRecentHistory?(): Promise<void>;
  clearMissingRequests?(): Promise<void>;
  clearAllPacks?(): Promise<void>;
  clearAllLocalData?(): Promise<void>;
}

export type OfflinePackStoreKind = "indexeddb" | "memory" | "sqlite";
