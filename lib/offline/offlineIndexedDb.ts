const DB_NAME = "lexienn_offline";
const DB_VERSION = 3;

export function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("offline_packs")) {
        db.createObjectStore("offline_packs", { keyPath: "pack_key" });
      }
      if (!db.objectStoreNames.contains("recent_phrases")) {
        const store = db.createObjectStore("recent_phrases", { keyPath: "id" });
        store.createIndex("used_at", "used_at");
      }
      if (!db.objectStoreNames.contains("recent_pairs")) {
        const store = db.createObjectStore("recent_pairs", { keyPath: "pack_key" });
        store.createIndex("used_at", "used_at");
      }
      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("missing_requests")) {
        const store = db.createObjectStore("missing_requests", { keyPath: "id" });
        store.createIndex("pack_key", "pack_key");
      }
      if (!db.objectStoreNames.contains("offline_entry_audio")) {
        db.createObjectStore("offline_entry_audio", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export function runOfflineTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openOfflineDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = callback(store);

        tx.oncomplete = () => {
          if (request instanceof IDBRequest) {
            resolve(request.result);
          } else {
            resolve(undefined);
          }
        };
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
      }),
  );
}

export function clearOfflineObjectStore(storeName: string): Promise<void> {
  return runOfflineTransaction(storeName, "readwrite", (store) => store.clear()).then(() => undefined);
}
