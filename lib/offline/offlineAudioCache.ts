import { runOfflineTransaction } from "@/lib/offline/offlineIndexedDb";
import { buildOfflineEntryAudioKey } from "@/lib/offline/offlinePackEntryUtils";
import type { OfflinePackAudioType } from "@/lib/schemas/enums";

export { buildOfflineEntryAudioKey };

export type OfflineEntryAudio = {
  id: string;
  pack_key: string;
  entry_id: string;
  audio_type: OfflinePackAudioType;
  voice_locale?: string;
  voice_style?: string;
  audio_local_path?: string;
  audio_blob_key: string;
  audio_hash?: string;
  duration_ms?: number;
  provider?: string;
  audio_base64: string;
  audio_blob?: Blob;
  audio_mime_type: string;
  cached_at: string;
};

const memoryCache = new Map<string, OfflineEntryAudio>();

function shouldUseMemoryCache(): boolean {
  return typeof indexedDB === "undefined";
}

function base64ToBlob(base64: string, mimeType: string): Blob | null {
  if (typeof atob !== "function") return null;
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mimeType });
  } catch {
    return null;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read audio blob."));
        return;
      }
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read audio blob."));
    reader.readAsDataURL(blob);
  });
}

export async function normalizeOfflineEntryAudio(
  record: OfflineEntryAudio,
): Promise<OfflineEntryAudio> {
  if (record.audio_base64) return record;
  if (record.audio_blob) {
    return {
      ...record,
      audio_base64: await blobToBase64(record.audio_blob),
    };
  }
  return record;
}

export async function getOfflineEntryAudio(
  cacheKey: string,
): Promise<OfflineEntryAudio | null> {
  if (shouldUseMemoryCache()) {
    const cached = memoryCache.get(cacheKey);
    return cached ? normalizeOfflineEntryAudio(cached) : null;
  }

  const result = await runOfflineTransaction<OfflineEntryAudio | undefined>(
    "offline_entry_audio",
    "readonly",
    (store) => store.get(cacheKey),
  );

  if (!result) return null;
  return normalizeOfflineEntryAudio(result);
}

export async function saveOfflineEntryAudio(input: {
  pack_key: string;
  entry_id: string;
  audio_base64: string;
  audio_mime_type: string;
  audio_type?: OfflinePackAudioType;
  voice_locale?: string;
  voice_style?: string;
  provider?: string;
  duration_ms?: number;
  audio_hash?: string;
}): Promise<void> {
  const blobKey = buildOfflineEntryAudioKey(input.pack_key, input.entry_id);
  const audioBlob = base64ToBlob(input.audio_base64, input.audio_mime_type);
  const record: OfflineEntryAudio = {
    id: blobKey,
    pack_key: input.pack_key,
    entry_id: input.entry_id,
    audio_type: input.audio_type ?? "ai_generated",
    voice_locale: input.voice_locale,
    voice_style: input.voice_style,
    audio_blob_key: blobKey,
    audio_hash: input.audio_hash,
    duration_ms: input.duration_ms,
    provider: input.provider ?? "openai",
    audio_mime_type: input.audio_mime_type,
    cached_at: new Date().toISOString(),
    audio_blob: audioBlob ?? undefined,
    audio_base64: audioBlob ? "" : input.audio_base64,
  };

  if (shouldUseMemoryCache()) {
    memoryCache.set(record.id, {
      ...record,
      audio_base64: input.audio_base64,
    });
    return;
  }

  try {
    await runOfflineTransaction("offline_entry_audio", "readwrite", (store) => store.put(record));
  } catch (error) {
    if (!audioBlob) throw error;
    await runOfflineTransaction("offline_entry_audio", "readwrite", (store) =>
      store.put({
        ...record,
        audio_blob: undefined,
        audio_base64: input.audio_base64,
      }),
    );
  }
}

export async function removeOfflinePackAudio(packKey: string): Promise<void> {
  if (shouldUseMemoryCache()) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${packKey}::`)) {
        memoryCache.delete(key);
      }
    }
    return;
  }

  const records = await runOfflineTransaction<OfflineEntryAudio[]>(
    "offline_entry_audio",
    "readonly",
    (store) => store.getAll(),
  );

  if (!records?.length) return;

  for (const record of records) {
    if (record.pack_key === packKey) {
      await runOfflineTransaction("offline_entry_audio", "readwrite", (store) =>
        store.delete(record.id),
      );
    }
  }
}

export function clearOfflineAudioCacheForTests(): void {
  memoryCache.clear();
}

export async function probeOfflineStorageWritable(): Promise<void> {
  if (shouldUseMemoryCache()) return;

  const probeKey = "__lexienn_storage_probe__";
  await runOfflineTransaction("offline_pack_download_progress", "readwrite", (store) =>
    store.put({
      pack_key: probeKey,
      source_language: "probe",
      target_language: "probe",
      category: "probe",
      total_items: 0,
      completed_items: 0,
      audio_completed_items: 0,
      status: "idle",
      updated_at: new Date().toISOString(),
      include_audio: false,
    }),
  );
  await runOfflineTransaction("offline_pack_download_progress", "readwrite", (store) =>
    store.delete(probeKey),
  );
}
