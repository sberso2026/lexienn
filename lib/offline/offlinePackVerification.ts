import type { OfflinePackGenerateRequest, OfflineStoredPack } from "@/lib/offline/offlinePackSchemas";
import { getOfflineEntryAudio } from "@/lib/offline/offlineAudioCache";
import { getTierPhraseTarget } from "@/lib/offline/offlinePackCoverage";

export type OfflinePackVerificationResult = {
  ok: boolean;
  errors: string[];
  phraseCount: number;
  audioCount: number;
};

export function verifyOfflinePackStructure(
  pack: OfflineStoredPack,
  request: Pick<OfflinePackGenerateRequest, "from_language" | "to_language" | "pack_tier">,
  options?: { requireAudio?: boolean },
): OfflinePackVerificationResult {
  const errors: string[] = [];
  const categories = new Set(pack.entries.map((entry) => entry.category));
  const minPhrases = getTierPhraseTarget(request.pack_tier ?? pack.pack_tier);

  if (pack.from_language_id !== request.from_language) {
    errors.push("Source language mismatch.");
  }
  if (pack.to_language_id !== request.to_language) {
    errors.push("Target language mismatch.");
  }
  if (pack.entries.length === 0) {
    errors.push("Pack has no phrases.");
  }
  if (pack.entries.length < Math.min(minPhrases, pack.phrase_count || minPhrases)) {
    errors.push("Phrase count is lower than expected.");
  }
  if (categories.size === 0) {
    errors.push("Pack has no categories.");
  }
  const missingText = pack.entries.filter(
    (entry) => !entry.source_text.trim() || !entry.translated_text.trim(),
  );
  if (missingText.length > 0) {
    errors.push("Some phrases are missing text.");
  }

  const audioCount = pack.entries.filter((entry) => entry.audio_blob_key).length;
  if (options?.requireAudio && audioCount === 0) {
    errors.push("No audio files were cached.");
  }

  return {
    ok: errors.length === 0,
    errors,
    phraseCount: pack.entries.length,
    audioCount,
  };
}

export async function verifyOfflinePackReadable(
  pack: OfflineStoredPack,
  request: Pick<OfflinePackGenerateRequest, "from_language" | "to_language" | "pack_tier">,
  options?: { requireAudio?: boolean },
): Promise<OfflinePackVerificationResult> {
  const structural = verifyOfflinePackStructure(pack, request, options);
  if (!structural.ok) return structural;

  if (!options?.requireAudio) {
    return structural;
  }

  const errors = [...structural.errors];
  let audioCount = 0;
  for (const entry of pack.entries) {
    if (!entry.audio_blob_key) continue;
    const cached = await getOfflineEntryAudio(entry.audio_blob_key);
    if (!cached) {
      errors.push(`Missing audio blob for entry ${entry.id}.`);
      continue;
    }
    if (!cached.audio_base64 && !cached.audio_blob) {
      errors.push(`Unreadable audio blob for entry ${entry.id}.`);
      continue;
    }
    audioCount += 1;
  }

  return {
    ok: errors.length === 0,
    errors,
    phraseCount: structural.phraseCount,
    audioCount,
  };
}
