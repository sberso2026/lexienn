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
  audio_mime_type: string;
  cached_at: string;
};

const memoryCache = new Map<string, OfflineEntryAudio>();

function shouldUseMemoryCache(): boolean {
  return typeof indexedDB === "undefined";
}

export async function getOfflineEntryAudio(
  cacheKey: string,
): Promise<OfflineEntryAudio | null> {
  if (shouldUseMemoryCache()) {
    return memoryCache.get(cacheKey) ?? null;
  }

  const result = await runOfflineTransaction<OfflineEntryAudio | undefined>(
    "offline_entry_audio",
    "readonly",
    (store) => store.get(cacheKey),
  );

  return result ?? null;
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
    audio_base64: input.audio_base64,
    audio_mime_type: input.audio_mime_type,
    cached_at: new Date().toISOString(),
  };

  if (shouldUseMemoryCache()) {
    memoryCache.set(record.id, record);
    return;
  }

  await runOfflineTransaction("offline_entry_audio", "readwrite", (store) => store.put(record));
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
