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

import { runOfflineTransaction } from "@/lib/offline/offlineIndexedDb";
import { clearOfflineObjectStore } from "@/lib/offline/offlineIndexedDb";



export const indexedDbOfflinePackStore: OfflinePackStore = {

  async savePack(pack) {

    const parsed = offlineStoredPackSchema.parse(pack);

    await runOfflineTransaction("offline_packs", "readwrite", (store) => store.put(parsed));

  },



  async getPackByKey(packKey) {

    const result = await runOfflineTransaction<OfflineStoredPack | undefined>(

      "offline_packs",

      "readonly",

      (store) => store.get(packKey),

    );

    if (!result) return null;

    const parsed = offlineStoredPackSchema.safeParse(result);

    return parsed.success ? parsed.data : null;

  },



  async listPacks() {

    const result = await runOfflineTransaction<OfflineStoredPack[]>(

      "offline_packs",

      "readonly",

      (store) => store.getAll(),

    );

    if (!result) return [];

    return result

      .map((item) => offlineStoredPackSchema.safeParse(item))

      .filter((parsed) => parsed.success)

      .map((parsed) => parsed.data);

  },



  async removePack(packKey) {

    await runOfflineTransaction("offline_packs", "readwrite", (store) => store.delete(packKey));

    return true;

  },



  async recordRecentPhrase(input) {

    const entry = offlineRecentPhraseSchema.parse({

      ...input,

      id: `${input.pack_key}:${input.entry_id}:${input.used_at}`,

    });

    await runOfflineTransaction("recent_phrases", "readwrite", (store) => store.put(entry));

  },



  async recordRecentPair(input) {

    const entry = offlineRecentPairSchema.parse(input);

    await runOfflineTransaction("recent_pairs", "readwrite", (store) => store.put(entry));

  },



  async getRecentPhrases(limit = 8) {

    const result = await runOfflineTransaction<OfflineRecentPhrase[]>(

      "recent_phrases",

      "readonly",

      (store) => store.getAll(),

    );

    if (!result) return [];

    return result

      .map((item) => offlineRecentPhraseSchema.safeParse(item))

      .filter((parsed) => parsed.success)

      .map((parsed) => parsed.data)

      .sort((a, b) => b.used_at.localeCompare(a.used_at))

      .slice(0, limit);

  },



  async getRecentPairs(limit = 6) {

    const result = await runOfflineTransaction<OfflineRecentPair[]>(

      "recent_pairs",

      "readonly",

      (store) => store.getAll(),

    );

    if (!result) return [];

    return result

      .map((item) => offlineRecentPairSchema.safeParse(item))

      .filter((parsed) => parsed.success)

      .map((parsed) => parsed.data)

      .sort((a, b) => b.used_at.localeCompare(a.used_at))

      .slice(0, limit);

  },



  async addFavorite(entryId, packKey) {

    const favorite = offlineFavoriteSchema.parse({

      id: `${packKey}:${entryId}`,

      entry_id: entryId,

      pack_key: packKey,

      created_at: new Date().toISOString(),

    });

    await runOfflineTransaction("favorites", "readwrite", (store) => store.put(favorite));

  },



  async removeFavorite(entryId) {

    const all = await runOfflineTransaction<Array<{ id: string; entry_id: string }>>(

      "favorites",

      "readonly",

      (store) => store.getAll(),

    );

    if (!all) return;

    for (const item of all) {

      if (item.entry_id === entryId) {

        await runOfflineTransaction("favorites", "readwrite", (store) => store.delete(item.id));

      }

    }

  },



  async listFavoriteEntryIds(packKey) {

    const result = await runOfflineTransaction<Array<{ entry_id: string; pack_key: string }>>(

      "favorites",

      "readonly",

      (store) => store.getAll(),

    );

    if (!result) return [];

    return result

      .filter((item) => !packKey || item.pack_key === packKey)

      .map((item) => item.entry_id);

  },



  async isFavorite(entryId) {

    const favorites = await runOfflineTransaction<Array<{ entry_id: string }>>(

      "favorites",

      "readonly",

      (store) => store.getAll(),

    );

    if (!favorites) return false;

    return favorites.some((item) => item.entry_id === entryId);

  },



  async saveMissingRequest(input: SaveMissingRequestInput) {

    const createdAt = new Date().toISOString();

    const request = offlineMissingRequestSchema.parse({

      id: `${input.pack_key}:${input.requested_text}:${createdAt}`,

      ...input,

      status: "saved_locally",

      created_at: createdAt,

    });

    await runOfflineTransaction("missing_requests", "readwrite", (store) => store.put(request));

    return request;

  },



  async listMissingRequests(packKey) {

    const result = await runOfflineTransaction<OfflineMissingRequest[]>(

      "missing_requests",

      "readonly",

      (store) => (packKey ? store.index("pack_key").getAll(packKey) : store.getAll()),

    );

    if (!result) return [];

    return result

      .map((item) => offlineMissingRequestSchema.safeParse(item))

      .filter((parsed) => parsed.success)

      .map((parsed) => parsed.data)

      .sort((a, b) => b.created_at.localeCompare(a.created_at));

  },



  async updateMissingRequestStatus(id, patch) {

    const existing = await runOfflineTransaction<OfflineMissingRequest | undefined>(

      "missing_requests",

      "readonly",

      (store) => store.get(id),

    );

    if (!existing) return null;

    const parsedExisting = offlineMissingRequestSchema.safeParse(existing);

    if (!parsedExisting.success) return null;

    const updated = offlineMissingRequestSchema.parse({

      ...parsedExisting.data,

      ...patch,

    });

    await runOfflineTransaction("missing_requests", "readwrite", (store) => store.put(updated));

    return updated;

  },

  async clearRecentHistory() {
    await clearOfflineObjectStore("recent_phrases");
    await clearOfflineObjectStore("recent_pairs");
  },

  async clearMissingRequests() {
    await clearOfflineObjectStore("missing_requests");
  },

  async clearAllPacks() {
    await clearOfflineObjectStore("offline_packs");
    await clearOfflineObjectStore("favorites");
    await clearOfflineObjectStore("offline_entry_audio");
  },

  async clearAllLocalData() {
    await clearOfflineObjectStore("offline_packs");
    await clearOfflineObjectStore("recent_phrases");
    await clearOfflineObjectStore("recent_pairs");
    await clearOfflineObjectStore("favorites");
    await clearOfflineObjectStore("missing_requests");
    await clearOfflineObjectStore("offline_entry_audio");
  },

};


