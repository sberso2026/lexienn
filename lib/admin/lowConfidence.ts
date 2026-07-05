import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/admin/constants";
import { getCatalogDialects } from "@/lib/admin/catalog";
import { mockDictionaryEntries } from "@/lib/mock/dictionary-entries";
import { mockPhrasePacks } from "@/lib/mock/phrase-packs";
import { getLanguageById } from "@/lib/mock/languages";
import type { ValidationStatus } from "@/lib/schemas";

export type LowConfidenceItem = {
  id: string;
  kind: "dictionary" | "dialect" | "offline_phrase";
  label: string;
  detail: string;
  confidence: number;
  validation_status: ValidationStatus;
  is_mock_data: boolean;
};

function isLowConfidence(score: number, status: ValidationStatus): boolean {
  return (
    score < LOW_CONFIDENCE_THRESHOLD ||
    status === "uncertain" ||
    status === "ai_generated"
  );
}

export function collectLowConfidenceItems(): LowConfidenceItem[] {
  const items: LowConfidenceItem[] = [];

  for (const entry of mockDictionaryEntries) {
    const score = entry.confidence.score;
    if (!isLowConfidence(score, entry.validation_status)) continue;

    items.push({
      id: entry.id,
      kind: "dictionary",
      label: entry.input_text,
      detail: `${entry.target_language} · ${entry.target_meaning.slice(0, 80)}`,
      confidence: score,
      validation_status: entry.validation_status,
      is_mock_data: entry.is_mock_data,
    });
  }

  for (const dialect of getCatalogDialects()) {
    if (!isLowConfidence(dialect.confidence_level, dialect.validation_status)) {
      continue;
    }

    const language = getLanguageById(dialect.language_id);
    items.push({
      id: dialect.id,
      kind: "dialect",
      label: dialect.variant_label,
      detail: language?.name ?? dialect.language_id,
      confidence: dialect.confidence_level,
      validation_status: dialect.validation_status,
      is_mock_data: dialect.is_mock_data,
    });
  }

  for (const pack of mockPhrasePacks) {
    for (const phrase of pack.phrases) {
      const score = phrase.confidence.score;
      if (!isLowConfidence(score, phrase.validation_status)) continue;

      items.push({
        id: phrase.id,
        kind: "offline_phrase",
        label: phrase.english,
        detail: `${pack.name} · ${phrase.target_text.slice(0, 60)}`,
        confidence: score,
        validation_status: phrase.validation_status,
        is_mock_data: phrase.is_mock_data,
      });
    }
  }

  return items.sort((a, b) => a.confidence - b.confidence);
}
