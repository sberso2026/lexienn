import type {
  OfflineMissingRequest,
  OfflineRecentPair,
  OfflineRecentPhrase,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";
import {
  offlineFavoriteSchema,
  offlineMissingRequestSchema,
  offlineRecentPairSchema,
  offlineRecentPhraseSchema,
  offlineStoredPackSchema,
} from "@/lib/offline/offlinePackSchemas";
import type { OfflinePackStore, SaveMissingRequestInput } from "@/lib/offline/offlinePackStore";

type MemoryDb = {
  packs: Map<string, OfflineStoredPack>;
  recentPhrases: OfflineRecentPhrase[];
  recentPairs: OfflineRecentPair[];
  favorites: Map<string, { entry_id: string; pack_key: string; created_at: string }>;
  missingRequests: OfflineMissingRequest[];
};

let memoryDb: MemoryDb | null = null;

function getDb(): MemoryDb {
  if (!memoryDb) {
    memoryDb = {
      packs: new Map(),
      recentPhrases: [],
      recentPairs: [],
      favorites: new Map(),
      missingRequests: [],
    };
  }
  return memoryDb;
}

export const memoryOfflinePackStore: OfflinePackStore = {
  async savePack(pack) {
    const parsed = offlineStoredPackSchema.parse(pack);
    getDb().packs.set(parsed.pack_key, parsed);
  },

  async getPackByKey(packKey) {
    return getDb().packs.get(packKey) ?? null;
  },

  async listPacks() {
    return [...getDb().packs.values()];
  },

  async removePack(packKey) {
    return getDb().packs.delete(packKey);
  },

  async recordRecentPhrase(input) {
    const entry = offlineRecentPhraseSchema.parse({
      ...input,
      id: `${input.pack_key}:${input.entry_id}:${input.used_at}`,
    });
    const db = getDb();
    db.recentPhrases = [
      entry,
      ...db.recentPhrases.filter((item) => item.id !== entry.id),
    ].slice(0, 12);
  },

  async recordRecentPair(input) {
    const entry = offlineRecentPairSchema.parse(input);
    const db = getDb();
    db.recentPairs = [
      entry,
      ...db.recentPairs.filter((item) => item.pack_key !== entry.pack_key),
    ].slice(0, 8);
  },

  async getRecentPhrases(limit = 8) {
    return getDb().recentPhrases.slice(0, limit);
  },

  async getRecentPairs(limit = 6) {
    return getDb().recentPairs.slice(0, limit);
  },

  async addFavorite(entryId, packKey) {
    const createdAt = new Date().toISOString();
    const favorite = offlineFavoriteSchema.parse({
      id: `${packKey}:${entryId}`,
      entry_id: entryId,
      pack_key: packKey,
      created_at: createdAt,
    });
    getDb().favorites.set(favorite.id, favorite);
  },

  async removeFavorite(entryId) {
    const db = getDb();
    for (const [id, favorite] of db.favorites.entries()) {
      if (favorite.entry_id === entryId) {
        db.favorites.delete(id);
      }
    }
  },

  async listFavoriteEntryIds(packKey) {
    const favorites = [...getDb().favorites.values()];
    return favorites
      .filter((item) => !packKey || item.pack_key === packKey)
      .map((item) => item.entry_id);
  },

  async isFavorite(entryId) {
    return [...getDb().favorites.values()].some((item) => item.entry_id === entryId);
  },

  async saveMissingRequest(input: SaveMissingRequestInput) {
    const createdAt = new Date().toISOString();
    const request = offlineMissingRequestSchema.parse({
      id: `${input.pack_key}:${input.requested_text}:${createdAt}`,
      ...input,
      status: "saved_locally",
      created_at: createdAt,
    });
    getDb().missingRequests = [request, ...getDb().missingRequests].slice(0, 50);
    return request;
  },

  async listMissingRequests(packKey) {
    const requests = getDb().missingRequests;
    const filtered = packKey
      ? requests.filter((item) => item.pack_key === packKey)
      : requests;
    return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async updateMissingRequestStatus(id, patch) {
    const db = getDb();
    const index = db.missingRequests.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const updated = offlineMissingRequestSchema.parse({
      ...db.missingRequests[index],
      ...patch,
    });
    db.missingRequests[index] = updated;
    return updated;
  },

  resetForTests() {
    memoryDb = {
      packs: new Map(),
      recentPhrases: [],
      recentPairs: [],
      favorites: new Map(),
      missingRequests: [],
    };
  },

  async clearRecentHistory() {
    const db = getDb();
    db.recentPhrases = [];
    db.recentPairs = [];
  },

  async clearMissingRequests() {
    getDb().missingRequests = [];
  },

  async clearAllPacks() {
    const db = getDb();
    db.packs.clear();
    db.favorites.clear();
  },

  async clearAllLocalData() {
    memoryOfflinePackStore.resetForTests?.();
  },
};

export function resetMemoryOfflinePackStoreForTests(): void {
  memoryOfflinePackStore.resetForTests?.();
}
