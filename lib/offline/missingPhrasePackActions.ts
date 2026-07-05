import { resolveLanguageSelection } from "@/lib/languages/languageOptions";
import { applyCoverageMetricsToPack } from "@/lib/offline/offlinePackCoverage";
import {
  buildOfflineEntryAudioKey,
  isValidOfflineEntry,
} from "@/lib/offline/offlinePackEntryUtils";
import { estimatePackSizeBytes } from "@/lib/offline/offlinePackKey";
import {
  LEXIENN_APP_VERSION,
  OFFLINE_PACK_CONTENT_VERSION,
  OFFLINE_PACK_SCHEMA_VERSION,
  OFFLINE_PACK_VERSION,
} from "@/lib/offline/offlinePackVersions";
import { normalizeOfflineSearchText } from "@/lib/offline/offlinePhraseSearch";
import type {
  OfflineMissingRequest,
  OfflinePackEntry,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";
import type { PhraseCategory } from "@/lib/schemas";

export type MissingPhraseTranslationResult = {
  translated_text: string;
  pronunciation_simple: string;
  usage_note?: string;
  source: string;
};

export function getMissingPhraseTranslation(
  request: OfflineMissingRequest,
): MissingPhraseTranslationResult | null {
  if (!request.translated_text?.trim()) return null;

  return {
    translated_text: request.translated_text,
    pronunciation_simple: request.pronunciation_simple ?? request.translated_text,
    usage_note: request.usage_note,
    source: request.translation_source ?? "ai",
  };
}

export function buildMissingRequestEntryId(packKey: string, requestId: string): string {
  return `${packKey}:missing:${requestId}`;
}

function createShellPack(request: OfflineMissingRequest): OfflineStoredPack {
  const fromResolved = resolveLanguageSelection(request.from_language_id);
  const toResolved = resolveLanguageSelection(request.to_language_id);
  const now = new Date().toISOString();

  return {
    id: request.pack_key,
    pack_key: request.pack_key,
    from_language_id: request.from_language_id,
    to_language_id: request.to_language_id,
    pack_tier: "lite",
    schema_version: OFFLINE_PACK_SCHEMA_VERSION,
    content_version: OFFLINE_PACK_CONTENT_VERSION,
    generated_by_app_version: LEXIENN_APP_VERSION,
    version: OFFLINE_PACK_VERSION,
    status: "downloaded",
    source: "ai_generated",
    phrase_count: 0,
    audio_count: 0,
    audio_coverage_percent: 0,
    text_coverage_percent: 0,
    estimated_size_bytes: estimatePackSizeBytes(1),
    downloaded_at: now,
    updated_at: now,
    from_display_name: fromResolved.display_label,
    to_display_name: toResolved.display_label,
    entry_count: 0,
    entries: [],
    examples: [],
  };
}

export function inferMissingPhraseCategory(text: string): PhraseCategory {
  const normalized = text.toLowerCase();

  if (/emergency|help now|danger|police|ambulance/.test(normalized)) return "emergency";
  if (/how to go|how do i get|where is|direction|turn left|turn right|nearest|take me to/.test(normalized)) {
    return "directions";
  }
  if (/food|water|drink|eat|hungry|restaurant/.test(normalized)) return "food_and_water";
  if (/bus|taxi|transport|airport|train|ferry/.test(normalized)) return "transport";
  if (/doctor|pain|medic|clinic|hospital|sick/.test(normalized)) return "medical";
  if (/how much|price|pay|money|change|cost/.test(normalized)) return "price_and_money";
  if (/room|hotel|stay|bathroom|accommodation/.test(normalized)) return "accommodation";
  if (/work|inspect|fieldwork|site|equipment/.test(normalized)) return "fieldwork_engineering";
  if (/shop|market|buy/.test(normalized)) return "shopping_and_market";
  if (/phone|call|message|internet|wifi/.test(normalized)) return "phone_and_communication";

  return "local_response_board";
}

function buildEntryFromMissingRequest(
  request: OfflineMissingRequest,
  entryId: string,
): OfflinePackEntry {
  const translation = getMissingPhraseTranslation(request);
  if (!translation) {
    throw new Error("Generate a translation before adding this phrase to your offline pack.");
  }

  const toResolved = resolveLanguageSelection(request.to_language_id);
  const now = new Date().toISOString();

  return {
    id: entryId,
    pack_id: request.pack_key,
    category: inferMissingPhraseCategory(request.requested_text),
    source_text: request.requested_text,
    translated_text: translation.translated_text,
    pronunciation_simple: translation.pronunciation_simple,
    usage_note: translation.usage_note,
    confidence_score: 0.7,
    validation_status: "ai_generated",
    source: "ai_generated",
    phrase_template_id: `missing:${request.id}`,
    audio_type: "unavailable",
    voice_metadata: {
      language_code: toResolved.base_language,
      dialect_id: toResolved.dialect_variant,
      audio_type: "unavailable",
      voice_locale: toResolved.locale_tag,
      voice_style: "local_conversational",
    },
    created_at: now,
    updated_at: now,
  };
}

export type AddMissingPhraseToPackResult = {
  pack: OfflineStoredPack;
  entry: OfflinePackEntry;
  createdPack: boolean;
};

export async function buildPackWithMissingPhraseEntry(
  pack: OfflineStoredPack | null,
  request: OfflineMissingRequest,
  cacheAudio: (
    pack: OfflineStoredPack,
    entry: OfflinePackEntry,
  ) => Promise<OfflinePackEntry>,
): Promise<AddMissingPhraseToPackResult> {
  const translation = getMissingPhraseTranslation(request);
  if (!translation) {
    throw new Error("Generate a translation before adding this phrase to your offline pack.");
  }

  const entryId = request.pack_entry_id ?? buildMissingRequestEntryId(request.pack_key, request.id);
  let nextPack = pack ?? createShellPack(request);
  const createdPack = !pack;
  const normalizedRequest = normalizeOfflineSearchText(request.requested_text);

  const existingEntry = nextPack.entries.find((entry) => {
    if (entry.id === entryId) return true;
    if (entry.source_text === request.requested_text) return true;
    const normalizedSource = normalizeOfflineSearchText(entry.source_text);
    return (
      normalizedSource === normalizedRequest ||
      normalizedSource.includes(normalizedRequest) ||
      normalizedRequest.includes(normalizedSource)
    );
  });
  if (existingEntry) {
    return { pack: nextPack, entry: existingEntry, createdPack };
  }

  let entry = buildEntryFromMissingRequest(request, entryId);
  if (!isValidOfflineEntry(entry)) {
    throw new Error("Could not build a valid offline pack entry for this phrase.");
  }

  entry = await cacheAudio(nextPack, entry);

  nextPack = applyCoverageMetricsToPack({
    ...nextPack,
    entries: [...nextPack.entries, entry],
    estimated_size_bytes: estimatePackSizeBytes(nextPack.entries.length + 1),
    updated_at: new Date().toISOString(),
    status: "downloaded",
  });

  return { pack: nextPack, entry, createdPack };
}

export function getMissingPhraseOfflineCacheKey(
  request: OfflineMissingRequest,
): string | undefined {
  if (!request.pack_entry_id) return undefined;
  return buildOfflineEntryAudioKey(request.pack_key, request.pack_entry_id);
}

export async function copyMissingPhraseText(request: OfflineMissingRequest): Promise<string> {
  const translation = getMissingPhraseTranslation(request);
  if (!translation) {
    throw new Error("No generated translation to copy.");
  }

  const lines = [
    request.requested_text,
    translation.translated_text,
    translation.pronunciation_simple,
  ];
  if (translation.usage_note) lines.push(translation.usage_note);

  return lines.join("\n");
}
