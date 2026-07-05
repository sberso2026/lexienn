import { indexedDbOfflinePackStore } from "@/lib/offline/indexedDbOfflinePackStore";
import { memoryOfflinePackStore } from "@/lib/offline/memoryOfflinePackStore";
import type { OfflinePackStore, OfflinePackStoreKind } from "@/lib/offline/offlinePackStore";

let testStore: OfflinePackStore | null = null;

export function setOfflinePackStoreForTests(store: OfflinePackStore | null): void {
  testStore = store;
}

export function getOfflinePackStoreKind(): OfflinePackStoreKind {
  if (testStore === memoryOfflinePackStore) return "memory";
  if (typeof indexedDB !== "undefined") return "indexeddb";
  return "memory";
}

export function getOfflinePackStore(): OfflinePackStore {
  if (testStore) return testStore;
  if (typeof indexedDB !== "undefined") return indexedDbOfflinePackStore;
  return memoryOfflinePackStore;
}

/** Force memory store for unit tests. */
export function activateMemoryOfflinePackStoreForTests(): void {
  setOfflinePackStoreForTests(memoryOfflinePackStore);
  memoryOfflinePackStore.resetForTests?.();
}

/** @deprecated use activateMemoryOfflinePackStoreForTests */
export const useMemoryOfflinePackStoreForTests = activateMemoryOfflinePackStoreForTests;

export function clearOfflinePackStoreForTests(): void {
  setOfflinePackStoreForTests(null);
}
