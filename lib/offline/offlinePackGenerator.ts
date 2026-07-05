import { getAiConfig, getOfflinePackAiTimeoutMs } from "@/lib/ai/config";
import { extractJsonFromAiText } from "@/lib/ai/parseAiJson";
import { requestOpenAiChatCompletion } from "@/lib/ai/openAiClient";
import { resolveLanguageSelection } from "@/lib/languages/languageOptions";
import { getPhrasePackById, mockPhrasePacks } from "@/lib/mock/phrase-packs";
import type { OfflinePhrase } from "@/lib/schemas";
import {
  getLitePackTemplatesForTier,
  LITE_PACK_MIN_PHRASES,
  type LitePackTemplate,
} from "@/lib/offline/litePhrasePack";
import { buildPackCoverageMetrics } from "@/lib/offline/offlinePackCoverage";
import {
  buildEntryShell,
  coerceConfidenceScore,
  coerceValidationStatus,
  finalizeOfflineEntry,
  isValidOfflineEntry,
  mapLegacyAudioType,
  normalizeEnglishPhrase,
  stripMockMarkers,
  type PackTemplateInput,
} from "@/lib/offline/offlinePackEntryUtils";
import {
  buildOfflinePackKey,
  estimatePackSizeBytes,
  getLanguagePairLabel,
} from "@/lib/offline/offlinePackKey";
import type {
  OfflinePackEntry,
  OfflinePackGenerateRequest,
  OfflineStoredPack,
} from "@/lib/offline/offlinePackSchemas";
import {
  offlineStoredPackSchema,
} from "@/lib/offline/offlinePackSchemas";

import {
  LEXIENN_APP_VERSION,
  OFFLINE_PACK_CONTENT_VERSION,
  OFFLINE_PACK_SCHEMA_VERSION,
  OFFLINE_PACK_VERSION,
} from "@/lib/offline/offlinePackVersions";
const PHILIPPINE_SOURCE_CODES = new Set(["tl", "ceb", "hil"]);
const OFFLINE_PACK_AI_BATCH_SIZE = 10;

function getTierTemplates(request: OfflinePackGenerateRequest): LitePackTemplate[] {
  return getLitePackTemplatesForTier(request.pack_tier ?? "lite");
}

function getMinimumValidEntries(request: OfflinePackGenerateRequest, total: number): number {
  if (request.pack_tier === "standard") return Math.min(400, total);
  if (request.pack_tier === "professional") return Math.min(1000, total);
  return Math.min(LITE_PACK_MIN_PHRASES, total);
}

function nowIso(): string {
  return new Date().toISOString();
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function getTemplateIdFromShell(shell: ReturnType<typeof buildEntryShell>): string {
  return shell.id.slice(shell.id.lastIndexOf(":") + 1);
}

function parseAiTranslationItems(
  parsed: Record<string, unknown>,
): Array<Record<string, unknown>> | null {
  const candidates = [parsed.translations, parsed.entries, parsed.phrases];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Array<Record<string, unknown>>;
  }
  return null;
}

function getCuratedLegacyPackForTarget(toLanguage: string): ReturnType<typeof getPhrasePackById> {
  const toResolved = resolveLanguageSelection(toLanguage);
  const match = mockPhrasePacks.find((pack) => {
    const langCode = pack.language_id.replace("lang-", "");
    return langCode === toResolved.base_language;
  });
  return match ? getPhrasePackById(match.id) : undefined;
}

function getPhilippineLegacyPhrases(fromLanguage: string): OfflinePhrase[] | null {
  const fromResolved = resolveLanguageSelection(fromLanguage);
  if (!PHILIPPINE_SOURCE_CODES.has(fromResolved.base_language)) return null;
  const pack = mockPhrasePacks.find(
    (item) => item.language_id === `lang-${fromResolved.base_language}`,
  );
  return pack?.phrases ?? null;
}

function findLegacyPhraseForTemplate(
  englishConcept: string,
  legacyPhrases: OfflinePhrase[],
): OfflinePhrase | undefined {
  const normalized = normalizeEnglishPhrase(englishConcept);
  return legacyPhrases.find(
    (phrase) => normalizeEnglishPhrase(phrase.english) === normalized,
  );
}

function buildCuratedEntries(
  request: OfflinePackGenerateRequest,
  packId: string,
  dialectId?: string,
): OfflinePackEntry[] | null {
  const fromResolved = resolveLanguageSelection(request.from_language);
  const legacyPack = getCuratedLegacyPackForTarget(request.to_language);
  if (!legacyPack) return null;
  if (fromResolved.base_language !== "en") return null;

  const timestamp = nowIso();
  return legacyPack.phrases.map((phrase) => ({
    id: `${packId}:${phrase.id}`,
    pack_id: packId,
    category: phrase.category,
    source_text: stripMockMarkers(phrase.english),
    translated_text: stripMockMarkers(phrase.target_text),
    pronunciation_simple: phrase.pronunciation_simple,
    usage_note: "Curated bundled phrase pack entry.",
    confidence_score: phrase.confidence.score,
    validation_status: phrase.validation_status,
    source: "curated" as const,
    phrase_template_id: phrase.id,
    audio_type: mapLegacyAudioType(phrase.audio_type),
    voice_metadata: {
      language_code: resolveLanguageSelection(request.to_language).base_language,
      dialect_id: dialectId ?? phrase.dialect_id,
      audio_type: mapLegacyAudioType(phrase.audio_type),
    },
    created_at: timestamp,
    updated_at: timestamp,
  }));
}

function buildEnglishSourceShells(
  request: OfflinePackGenerateRequest,
  packId: string,
): ReturnType<typeof buildEntryShell>[] | null {
  const fromResolved = resolveLanguageSelection(request.from_language);
  if (fromResolved.base_language !== "en") return null;

  const timestamp = nowIso();
  return getTierTemplates(request).map((template) =>
    buildEntryShell(packId, template, template.source_text, timestamp),
  );
}

function buildPhilippineSourceShells(
  request: OfflinePackGenerateRequest,
  packId: string,
): ReturnType<typeof buildEntryShell>[] | null {
  const legacyPhrases = getPhilippineLegacyPhrases(request.from_language);
  if (!legacyPhrases) return null;

  const timestamp = nowIso();
  return getTierTemplates(request).map((template) => {
    const legacyMatch = findLegacyPhraseForTemplate(template.source_text, legacyPhrases);
    const sourceText = legacyMatch
      ? stripMockMarkers(legacyMatch.target_text)
      : template.source_text;
    return buildEntryShell(packId, template, sourceText, timestamp);
  });
}

async function translateEntryBatchWithAi(
  shells: ReturnType<typeof buildEntryShell>[],
  request: OfflinePackGenerateRequest,
): Promise<OfflinePackEntry[] | null> {
  const config = getAiConfig();
  if (!config.isConfigured) return null;

  const fromLabel =
    request.from_display_name ??
    resolveLanguageSelection(request.from_language).display_label;
  const toLabel =
    request.target_display_name ??
    resolveLanguageSelection(request.to_language).display_label;
  const toResolved = resolveLanguageSelection(request.to_language);

  const prompt = [
    "Translate offline phrase pack entries as JSON only.",
    `Source language: ${fromLabel} (${request.from_language})`,
    `Target language: ${toLabel} (${request.to_language})`,
    request.target_dialect_label ? `Target dialect: ${request.target_dialect_label}` : null,
    "Rules:",
    "- Keep each id unchanged.",
    "- translated_text must be in the target language.",
    "- source_text is already in the source language; do not rewrite it.",
    "- Include pronunciation_simple for translated_text (romanization or phonetic spelling).",
    "- validation_status must be ai_generated or uncertain.",
    "- Do not claim native-speaker validation.",
    "Return JSON:",
    '{ "translations": [{ "id": string, "translated_text": string, "pronunciation_simple": string, "usage_note"?: string, "confidence_score"?: number, "validation_status"?: string }] }',
    "Entries:",
    JSON.stringify(
      shells.map((shell) => ({
        id: getTemplateIdFromShell(shell),
        source_text: shell.source_text,
        category: shell.category,
      })),
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const content = await requestOpenAiChatCompletion(
    {
      model: config.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are Lexienn offline pack generator. Return JSON only. No markdown.",
        },
        { role: "user", content: prompt },
      ],
    },
    { timeoutMs: getOfflinePackAiTimeoutMs() },
  );

  if (!content) return null;

  try {
    const parsed = extractJsonFromAiText(content) as Record<string, unknown>;
    const translationItems = parseAiTranslationItems(parsed);
    if (!translationItems) return null;

    const translationById = new Map(
      translationItems.map((item) => [String(item.id ?? ""), item]),
    );

    return shells.map((shell) => {
      const templateId = getTemplateIdFromShell(shell);
      const translation = translationById.get(templateId) ?? translationById.get(shell.id);
      const translatedText = String(
        translation?.translated_text ?? translation?.target_text ?? "",
      ).trim();

      return finalizeOfflineEntry(shell, translatedText || shell.source_text, {
        pronunciation_simple: String(
          translation?.pronunciation_simple ?? translatedText ?? shell.source_text,
        ),
        usage_note:
          typeof translation?.usage_note === "string" ? translation.usage_note : undefined,
        confidence_score: coerceConfidenceScore(translation?.confidence_score),
        validation_status: coerceValidationStatus(translation?.validation_status),
        language_code: toResolved.base_language,
        dialect_id: request.to_dialect,
      });
    });
  } catch {
    return null;
  }
}

async function translateEntryShellsWithAi(
  shells: ReturnType<typeof buildEntryShell>[],
  request: OfflinePackGenerateRequest,
): Promise<OfflinePackEntry[] | null> {
  const batches = chunk(shells, OFFLINE_PACK_AI_BATCH_SIZE);
  const allEntries: OfflinePackEntry[] = [];

  for (const batch of batches) {
    let batchEntries = await translateEntryBatchWithAi(batch, request);
    if (!batchEntries) {
      batchEntries = await translateEntryBatchWithAi(batch, request);
    }
    if (!batchEntries) return null;
    allEntries.push(...batchEntries);
  }

  const validEntries = allEntries.filter(isValidOfflineEntry);
  return validEntries.length >= getMinimumValidEntries(request, shells.length)
    ? validEntries
    : null;
}

async function generateEntryBatchWithAi(
  templates: PackTemplateInput[],
  request: OfflinePackGenerateRequest,
  packId: string,
  timestamp: string,
): Promise<OfflinePackEntry[] | null> {
  const config = getAiConfig();
  if (!config.isConfigured) return null;

  const fromLabel =
    request.from_display_name ??
    resolveLanguageSelection(request.from_language).display_label;
  const toLabel =
    request.target_display_name ??
    resolveLanguageSelection(request.to_language).display_label;
  const toResolved = resolveLanguageSelection(request.to_language);

  const prompt = [
    "Generate an offline phrase pack as JSON only.",
    `From language: ${fromLabel} (${request.from_language})`,
    `To language: ${toLabel} (${request.to_language})`,
    request.target_dialect_label ? `Target dialect: ${request.target_dialect_label}` : null,
    "Rules:",
    "- For each template, source_text must be in the FROM language.",
    "- translated_text must be in the TO language.",
    "- Do not invent dialect certainty.",
    "- validation_status must be ai_generated or uncertain.",
    "- Do not claim native-speaker or verified dictionary validation.",
    "- Include pronunciation_simple for translated_text.",
    "Return JSON:",
    '{ "entries": [{ "id": string, "category": string, "source_text": string, "translated_text": string, "pronunciation_simple": string, "literal_translation"?: string, "usage_note"?: string, "confidence_score"?: number, "validation_status"?: string }] }',
    "Templates:",
    JSON.stringify(
      templates.map((item) => ({
        id: item.id,
        category: item.category,
        english_concept: item.source_text,
      })),
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const content = await requestOpenAiChatCompletion(
    {
      model: config.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are Lexienn offline pack generator. Return JSON only. No markdown.",
        },
        { role: "user", content: prompt },
      ],
    },
    { timeoutMs: getOfflinePackAiTimeoutMs() },
  );

  if (!content) return null;

  try {
    const parsed = extractJsonFromAiText(content) as Record<string, unknown>;
    const aiEntries = parseAiTranslationItems(parsed);
    if (!aiEntries) return null;

    const entriesById = new Map(aiEntries.map((entry) => [String(entry.id ?? ""), entry]));

    return templates.map((template) => {
      const aiEntry = entriesById.get(template.id);
      const shell = buildEntryShell(
        packId,
        template,
        String(aiEntry?.source_text ?? template.source_text),
        timestamp,
      );
      const translatedText = String(aiEntry?.translated_text ?? "").trim();

      return finalizeOfflineEntry(shell, translatedText || shell.source_text, {
        pronunciation_simple: String(
          aiEntry?.pronunciation_simple ?? translatedText ?? shell.source_text,
        ),
        usage_note: typeof aiEntry?.usage_note === "string" ? aiEntry.usage_note : undefined,
        confidence_score: coerceConfidenceScore(aiEntry?.confidence_score),
        validation_status: coerceValidationStatus(aiEntry?.validation_status),
        language_code: toResolved.base_language,
        dialect_id: request.to_dialect,
      });
    });
  } catch {
    return null;
  }
}

async function generateEntriesWithAi(
  request: OfflinePackGenerateRequest,
  packId: string,
): Promise<OfflinePackEntry[] | null> {
  const timestamp = nowIso();
  const templates = getTierTemplates(request);
  const batches = chunk(templates, OFFLINE_PACK_AI_BATCH_SIZE);
  const allEntries: OfflinePackEntry[] = [];

  for (const batch of batches) {
    let batchEntries = await generateEntryBatchWithAi(batch, request, packId, timestamp);
    if (!batchEntries) {
      batchEntries = await generateEntryBatchWithAi(batch, request, packId, timestamp);
    }
    if (!batchEntries) return null;
    allEntries.push(...batchEntries);
  }

  const validEntries = allEntries.filter(isValidOfflineEntry);
  return validEntries.length >= getMinimumValidEntries(request, templates.length)
    ? validEntries
    : null;
}

function buildStoredPack(
  request: OfflinePackGenerateRequest,
  packId: string,
  packKey: string,
  entries: OfflinePackEntry[],
  source: OfflineStoredPack["source"],
  timestamp: string,
  status: OfflineStoredPack["status"] = "text_ready",
): OfflineStoredPack | null {
  const toResolved = resolveLanguageSelection(request.to_language);
  const fromResolved = resolveLanguageSelection(request.from_language);
  const metrics = buildPackCoverageMetrics({
    entries,
    pack_tier: request.pack_tier ?? "lite",
  });

  const parsed = offlineStoredPackSchema.safeParse({
    id: packId,
    from_language_id: request.from_language,
    to_language_id: request.to_language,
    to_variant_label: request.target_dialect_label ?? toResolved.dialect_label,
    pack_key: packKey,
    pack_tier: request.pack_tier ?? "lite",
    schema_version: OFFLINE_PACK_SCHEMA_VERSION,
    content_version: OFFLINE_PACK_CONTENT_VERSION,
    generated_by_app_version: LEXIENN_APP_VERSION,
    version: OFFLINE_PACK_VERSION,
    status,
    source,
    phrase_count: metrics.phrase_count,
    audio_count: metrics.audio_count,
    audio_coverage_percent: metrics.audio_coverage_percent,
    text_coverage_percent: metrics.text_coverage_percent,
    estimated_size_bytes: estimatePackSizeBytes(entries.length),
    downloaded_at: timestamp,
    updated_at: timestamp,
    from_display_name: request.from_display_name ?? fromResolved.display_label,
    to_display_name: request.target_display_name ?? toResolved.display_label,
    entry_count: entries.length,
    entries,
    examples: [],
  });

  return parsed.success ? parsed.data : null;
}

function buildValidationSummary(pack: OfflineStoredPack) {
  const metrics = buildPackCoverageMetrics(pack);
  const warnings: string[] = [];
  if (metrics.phrase_count < LITE_PACK_MIN_PHRASES && pack.pack_tier === "lite") {
    warnings.push(`Lite pack has ${metrics.phrase_count} phrases; target is ${LITE_PACK_MIN_PHRASES}.`);
  }
  if (!metrics.full_audio_ready) {
    warnings.push(
      `Audio coverage ${metrics.audio_coverage_percent}%. Download audio while online for full offline playback.`,
    );
  }
  return {
    phrase_count: metrics.phrase_count,
    audio_ready_count: metrics.audio_count,
    audio_coverage_percent: metrics.audio_coverage_percent,
    text_coverage_percent: metrics.text_coverage_percent,
    full_audio_ready: metrics.full_audio_ready,
    warnings,
  };
}

export async function generateOfflineLanguagePairPack(
  request: OfflinePackGenerateRequest,
  options: { forceAi?: boolean } = {},
): Promise<{
  pack: OfflineStoredPack;
  generated_online: boolean;
  validation_summary: ReturnType<typeof buildValidationSummary>;
  audio_manifest: [];
  warnings: string[];
} | null> {
  const packKey = buildOfflinePackKey(request.from_language, request.to_language);
  const packId = `offline-pack:${packKey}`;
  const timestamp = nowIso();

  let entries: OfflinePackEntry[] | null = null;
  let source: OfflineStoredPack["source"] = "unavailable";
  let generatedOnline = false;

  if (!options.forceAi) {
    entries = buildCuratedEntries(request, packId, request.to_dialect);
    if (entries && entries.length >= getMinimumValidEntries(request, getTierTemplates(request).length)) {
      source = "curated";
    } else {
      entries = null;
    }
  }

  if (!entries) {
    const englishShells = buildEnglishSourceShells(request, packId);
    if (englishShells) {
      entries = await translateEntryShellsWithAi(englishShells, request);
      if (entries) {
        source = "ai_generated";
        generatedOnline = true;
      }
    }
  }

  if (!entries) {
    const shells = buildPhilippineSourceShells(request, packId);
    if (shells) {
      entries = await translateEntryShellsWithAi(shells, request);
      if (entries) {
        source = "ai_generated";
        generatedOnline = true;
      }
    }
  }

  if (!entries) {
    entries = await generateEntriesWithAi(request, packId);
    if (entries) {
      source = "ai_generated";
      generatedOnline = true;
    }
  }

  if (!entries) {
    return null;
  }

  const pack = buildStoredPack(request, packId, packKey, entries, source, timestamp, "text_ready");
  if (!pack) return null;

  const validation_summary = buildValidationSummary(pack);
  return {
    pack,
    generated_online: generatedOnline,
    validation_summary,
    audio_manifest: [],
    warnings: validation_summary.warnings,
  };
}

export function canGenerateOfflinePackWithoutAi(
  request: OfflinePackGenerateRequest,
): boolean {
  const fromResolved = resolveLanguageSelection(request.from_language);
  if (fromResolved.base_language !== "en") return false;
  return Boolean(getCuratedLegacyPackForTarget(request.to_language));
}

export { getLanguagePairLabel, OFFLINE_PACK_VERSION as PACK_VERSION };
