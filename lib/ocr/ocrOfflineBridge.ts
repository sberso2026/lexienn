import { buildOfflinePackKey } from "@/lib/offline/offlinePackKey";
import { getOfflinePackByKey } from "@/lib/offline/localOfflineStore";
import { recordOfflineMissingPhraseRequest } from "@/lib/offline/offlinePackService";
import { searchOfflinePackEntries } from "@/lib/offline/offlinePhraseSearch";
import { packEntryToLegacyPhrase } from "@/lib/offline/localOfflineStore";
import { resolveOfflineTranslation } from "@/lib/offline/offlineTranslationResolver";
import { resolveLanguageSelection } from "@/lib/languages/languageOptions";
import type { OfflinePhrasePack } from "@/lib/schemas";
import type { TranslatorResponse } from "@/lib/translator/translatorSchemas";

function packToLegacyPhrasePack(
  pack: Awaited<ReturnType<typeof getOfflinePackByKey>>,
  dialectId?: string,
): OfflinePhrasePack | null {
  if (!pack) return null;
  const phrases = pack.entries.map((entry) => packEntryToLegacyPhrase(entry, dialectId));
  const categories = [...new Set(phrases.map((phrase) => phrase.category))];
  return {
    id: pack.id,
    language_id: `lang-${resolveLanguageSelection(pack.to_language_id).base_language}`,
    dialect_id: dialectId ?? resolveLanguageSelection(pack.to_language_id).dialect_variant ?? "standard",
    name: `${pack.from_display_name} → ${pack.to_display_name}`,
    categories,
    phrases,
    phrase_count: phrases.length,
    estimated_size_kb: Math.round(pack.estimated_size_bytes / 1024),
    is_mock_data: false,
  };
}

function buildResponseFromOfflineMatch(
  originalText: string,
  translatedText: string,
  pronunciation: string,
  confidence: number,
  sourceLanguage: string,
  targetLanguageSelection: string,
  source: TranslatorResponse["source"],
): TranslatorResponse {
  const targetResolved = resolveLanguageSelection(targetLanguageSelection);
  return {
    original_text: originalText,
    translated_text: translatedText,
    source_language: sourceLanguage,
    target_language: targetResolved.base_language,
    target_dialect: targetResolved.dialect_variant,
    natural_translation: translatedText,
    pronunciation_simple: pronunciation,
    confidence_score: confidence,
    validation_status: "ai_generated_unverified",
    source,
    reliability_label: "Offline pack match",
  };
}

export async function tryTranslateOcrTextOffline(
  sourceLanguage: string,
  targetLanguageSelection: string,
  text: string,
): Promise<TranslatorResponse | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const normalizedSource =
    sourceLanguage === "auto" || sourceLanguage === "unknown" ? "en" : sourceLanguage;
  const packKey = buildOfflinePackKey(normalizedSource, targetLanguageSelection);
  const pack = await getOfflinePackByKey(packKey);
  if (!pack) return null;

  const directMatches = searchOfflinePackEntries(pack, trimmed);
  if (directMatches.length > 0) {
    const entry = directMatches[0]!;
    return buildResponseFromOfflineMatch(
      trimmed,
      entry.translated_text,
      entry.pronunciation_simple,
      entry.confidence_score,
      sourceLanguage,
      targetLanguageSelection,
      "phrase_pack",
    );
  }

  const sourceResolved = resolveLanguageSelection(sourceLanguage);
  if (sourceResolved.base_language === "en") {
    const legacyPack = packToLegacyPhrasePack(
      pack,
      resolveLanguageSelection(targetLanguageSelection).dialect_variant,
    );
    if (!legacyPack) return null;

    const offline = resolveOfflineTranslation(
      trimmed,
      legacyPack,
      resolveLanguageSelection(targetLanguageSelection).base_language,
    );
    if (offline.resolution_method === "unavailable") return null;

    return buildResponseFromOfflineMatch(
      trimmed,
      offline.resolved_translation,
      offline.pronunciation_simple ?? offline.resolved_translation,
      offline.confidence_score,
      sourceLanguage,
      targetLanguageSelection,
      "phrase_pack",
    );
  }

  return null;
}

export async function saveOcrMissingTranslationRequest(input: {
  from_language_id: string;
  to_language_id: string;
  requested_text: string;
  user_context: string;
}): Promise<void> {
  await recordOfflineMissingPhraseRequest({
    pack_key: buildOfflinePackKey(input.from_language_id, input.to_language_id),
    from_language_id: input.from_language_id,
    to_language_id: input.to_language_id,
    requested_text: input.requested_text,
    user_context: input.user_context,
    request_type: "ocr",
  });
}
