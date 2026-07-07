import { applyCoverageMetricsToPack } from "@/lib/offline/offlinePackCoverage";
import {
  buildOfflineEntryAudioKey,
  saveOfflineEntryAudio,
} from "@/lib/offline/offlineAudioCache";
import type { OfflinePackEntry, OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import { requestVoiceSpeech } from "@/lib/voice/voiceApiClient";
import { buildVoiceInstruction, resolveLanguageSelection } from "@/lib/languages/languageOptions";

const CACHE_CONCURRENCY = 2;
const VOICE_STYLE = "local_conversational";

export type CacheOfflinePackAudioResult = {
  cached: number;
  skipped: number;
  pack: OfflineStoredPack;
};

export type CacheOfflinePackAudioProgress = {
  cached: number;
  skipped: number;
  total: number;
};

export type CacheOfflinePackAudioOptions = {
  startFromIndex?: number;
  onProgress?: (progress: CacheOfflinePackAudioProgress) => void | Promise<void>;
  shouldContinue?: () => boolean;
  signal?: AbortSignal;
};

async function cacheEntryAudio(
  pack: OfflineStoredPack,
  entry: OfflinePackEntry,
  toLanguage: string,
): Promise<{ saved: boolean; entry?: OfflinePackEntry }> {
  const resolved = resolveLanguageSelection(toLanguage);

  try {
    const response = await requestVoiceSpeech({
      text: entry.translated_text,
      language: resolved.base_language,
      dialect: resolved.dialect_variant,
      dialect_label: resolved.dialect_label,
      region: resolved.region,
      locale_tag: resolved.locale_tag,
      voice_instruction: buildVoiceInstruction(resolved),
      speed: "normal",
      voice_mode: "ai",
      pronunciation_simple: entry.pronunciation_simple,
    });

    if (response.audio_type !== "ai_generated" || !response.audio_base64) {
      return { saved: false };
    }

    const blobKey = buildOfflineEntryAudioKey(pack.pack_key, entry.id);
    await saveOfflineEntryAudio({
      pack_key: pack.pack_key,
      entry_id: entry.id,
      audio_base64: response.audio_base64,
      audio_mime_type: response.audio_mime_type ?? "audio/mpeg",
      audio_type: "ai_generated",
      voice_locale: resolved.locale_tag,
      voice_style: VOICE_STYLE,
      provider: response.provider,
    });

    const updatedEntry: OfflinePackEntry = {
      ...entry,
      audio_type: "ai_generated",
      audio_blob_key: blobKey,
      voice_metadata: {
        language_code: resolved.base_language,
        dialect_id: resolved.dialect_variant,
        audio_type: "ai_generated",
        voice_locale: resolved.locale_tag,
        voice_style: VOICE_STYLE,
      },
      updated_at: new Date().toISOString(),
    };

    return { saved: true, entry: updatedEntry };
  } catch {
    return { saved: false };
  }
}

export async function cacheSingleOfflineEntryAudio(
  pack: OfflineStoredPack,
  entry: OfflinePackEntry,
  toLanguage: string,
): Promise<{ saved: boolean; entry: OfflinePackEntry }> {
  const result = await cacheEntryAudio(pack, entry, toLanguage);
  return {
    saved: result.saved,
    entry: result.entry ?? entry,
  };
}

export async function cacheOfflinePackAudio(
  pack: OfflineStoredPack,
  toLanguage: string,
  options?: CacheOfflinePackAudioOptions,
): Promise<CacheOfflinePackAudioResult> {
  if (typeof window === "undefined") {
    return { cached: 0, skipped: pack.entries.length, pack };
  }

  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
  if (!isOnline) {
    return { cached: 0, skipped: pack.entries.length, pack };
  }

  let cached = 0;
  let skipped = 0;
  const updatedEntries = [...pack.entries];
  const entryIndex = new Map(updatedEntries.map((entry, index) => [entry.id, index]));
  const startFrom = options?.startFromIndex ?? 0;
  const pendingEntries = pack.entries.slice(startFrom);
  const queue = [...pendingEntries];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      if (options?.signal?.aborted) return;
      if (options?.shouldContinue && !options.shouldContinue()) return;

      const entry = queue.shift();
      if (!entry) return;

      const result = await cacheEntryAudio(pack, entry, toLanguage);
      if (result.saved && result.entry) {
        cached += 1;
        const index = entryIndex.get(entry.id);
        if (index !== undefined) updatedEntries[index] = result.entry;
      } else {
        skipped += 1;
      }

      await options?.onProgress?.({
        cached: startFrom + cached,
        skipped,
        total: pack.entries.length,
      });
    }
  }

  const workers = Array.from(
    { length: Math.min(CACHE_CONCURRENCY, Math.max(queue.length, 1)) },
    () => worker(),
  );
  await Promise.all(workers);

  const nextPack = applyCoverageMetricsToPack({
    ...pack,
    entries: updatedEntries,
    status:
      cached > 0 || pack.status === "text_ready"
        ? cached === pack.entries.length
          ? "downloaded"
          : "text_ready"
        : pack.status,
    updated_at: new Date().toISOString(),
  });

  return { cached: startFrom + cached, skipped, pack: nextPack };
}
