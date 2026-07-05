import type { ValidationStatus } from "@/lib/schemas";
import type { BasePhraseTemplate } from "@/lib/offline/basePhraseTemplates";
import type { LitePackTemplate } from "@/lib/offline/litePhrasePack";
import type { OfflinePackEntry } from "@/lib/offline/offlinePackSchemas";
import type { OfflinePackAudioType } from "@/lib/schemas/enums";

const VALIDATION_STATUSES: ValidationStatus[] = [
  "ai_generated",
  "ai_generated_unverified",
  "verified_dictionary",
  "community_corrected",
  "native_speaker_reviewed",
  "professionally_reviewed",
  "uncertain",
];

export type PackTemplateInput = Pick<
  LitePackTemplate,
  "id" | "category" | "source_text" | "phrase_template_id" | "usage_note"
>;

export function normalizeEnglishPhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s*\(mvp mock\)\s*/gi, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripMockMarkers(text: string): string {
  return text.replace(/\s*\(MVP mock\)\s*/gi, "").trim();
}

export function coerceValidationStatus(value: unknown): ValidationStatus {
  if (typeof value === "string" && VALIDATION_STATUSES.includes(value as ValidationStatus)) {
    return value as ValidationStatus;
  }
  return "ai_generated";
}

export function coerceConfidenceScore(value: unknown, fallback = 0.62): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function mapLegacyAudioType(value: string | undefined): OfflinePackAudioType {
  if (value === "native_recorded") return "native_recorded";
  if (value === "cached_cloud_tts") return "ai_generated";
  return "unavailable";
}

export function buildEntryShell(
  packId: string,
  template: PackTemplateInput | BasePhraseTemplate,
  sourceText: string,
  timestamp: string,
): Pick<
  OfflinePackEntry,
  | "id"
  | "pack_id"
  | "category"
  | "source_text"
  | "translated_text"
  | "pronunciation_simple"
  | "confidence_score"
  | "validation_status"
  | "source"
  | "phrase_template_id"
  | "audio_type"
  | "created_at"
  | "updated_at"
> {
  const phraseTemplateId =
    "phrase_template_id" in template ? template.phrase_template_id : template.id;

  return {
    id: `${packId}:${template.id}`,
    pack_id: packId,
    category: template.category,
    source_text: sourceText,
    translated_text: sourceText,
    pronunciation_simple: sourceText,
    confidence_score: 0.62,
    validation_status: "ai_generated",
    source: "ai_generated",
    phrase_template_id: phraseTemplateId,
    audio_type: "unavailable",
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function finalizeOfflineEntry(
  shell: ReturnType<typeof buildEntryShell>,
  translatedText: string,
  options: {
    pronunciation_simple?: string;
    usage_note?: string;
    confidence_score?: number;
    validation_status?: ValidationStatus;
    language_code: string;
    dialect_id?: string;
    voice_locale?: string;
    voice_style?: string;
    audio_type?: OfflinePackAudioType;
    audio_blob_key?: string;
    source?: OfflinePackEntry["source"];
  },
): OfflinePackEntry {
  const score = coerceConfidenceScore(options.confidence_score, shell.confidence_score);
  const audioType = options.audio_type ?? shell.audio_type;
  return {
    ...shell,
    translated_text: translatedText.trim(),
    pronunciation_simple: (options.pronunciation_simple ?? translatedText).trim(),
    usage_note: options.usage_note ?? shell.phrase_template_id ? undefined : undefined,
    confidence_score: score,
    validation_status: options.validation_status ?? "ai_generated",
    source: options.source ?? shell.source,
    audio_type: audioType,
    audio_blob_key: options.audio_blob_key,
    voice_metadata: {
      language_code: options.language_code,
      dialect_id: options.dialect_id,
      audio_type: audioType,
      voice_locale: options.voice_locale,
      voice_style: options.voice_style,
    },
    updated_at: new Date().toISOString(),
  };
}

export function isValidOfflineEntry(entry: OfflinePackEntry): boolean {
  return (
    entry.source_text.trim().length > 0 &&
    entry.translated_text.trim().length > 0 &&
    entry.pronunciation_simple.trim().length > 0
  );
}

export function buildOfflineEntryAudioKey(packKey: string, entryId: string): string {
  return `${packKey}::${entryId}`;
}
