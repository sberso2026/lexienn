import { productionConfidence } from "@/lib/dictionary/normalizeDictionaryEntry";

import type { DictionaryQuery } from "@/lib/schemas";



function asRecord(value: unknown): Record<string, unknown> | null {

  if (typeof value !== "object" || value === null || Array.isArray(value)) {

    return null;

  }

  return value as Record<string, unknown>;

}



function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {

  for (const key of keys) {

    const value = obj[key];

    if (typeof value === "string" && value.trim().length > 0) {

      return value.trim();

    }

  }

  return undefined;

}



function mapSampleSentences(

  value: unknown,

  query: DictionaryQuery,

): unknown[] | undefined {

  if (!Array.isArray(value)) return undefined;



  return value.map((item) => {

    if (typeof item === "string") {

      return {

        text: item,

        language_code: query.source_language,

        context_label: "Example",

      };

    }

    return item;

  });

}



/**

 * Coerce common AI output shapes into something closer to DictionaryEntry

 * before Zod validation.

 */

export function normalizeAiEntryPayload(

  raw: unknown,

  query: DictionaryQuery,

): unknown {

  const obj = asRecord(raw);

  if (!obj) return raw;



  const next: Record<string, unknown> = { ...obj };



  next.id =

    typeof next.id === "string" && next.id.length > 0

      ? next.id

      : `entry-ai-${Date.now()}`;

  next.input_text = query.input_text.trim();

  next.source_language = query.source_language;

  next.target_language = query.target_language;

  next.target_dialect = query.target_dialect ?? next.target_dialect;



  if (!next.general_meaning_en) {
    next.general_meaning_en = pickString(
      next,
      "generalMeaning",
      "general_meaning_english",
      "general_meaning",
    );
  }

  if (!next.detailed_meaning_en) {
    next.detailed_meaning_en = pickString(
      next,
      "detailedMeaning",
      "detailed_meaning_english",
      "detailed_meaning",
    );
  }

  if (!next.target_meaning) {
    next.target_meaning = pickString(
      next,
      "definitionSummary",
      "target_language_meaning",
      "target_meaning_text",
    );
  }



  const sampleSentences = mapSampleSentences(next.sample_sentences, query);

  if (sampleSentences && !Array.isArray(next.examples)) {

    next.examples = sampleSentences;

  }



  if (

    typeof next.profession_specific_meaning === "string" &&

    !Array.isArray(next.profession_meanings)

  ) {

    next.profession_meanings = [

      {

        context: query.user_context,

        meaning_en: next.profession_specific_meaning,

      },

    ];

  }



  if (!next.entry_type) {
    const input = query.input_text.trim();
    next.entry_type = input.split(/\s+/).length >= 2 ? "phrase" : "word";
  }

  if (!next.audio_type) {
    next.audio_type = "synthetic_tts";
  }

  if (!next.validation_status) {
    next.validation_status = "ai_generated_unverified";
  }

  if (typeof next.confidence_score === "number") {
    next.confidence = productionConfidence(next.confidence_score);
  } else if (!next.confidence && asRecord(next.confidence)) {
    const confidence = asRecord(next.confidence)!;
    if (typeof confidence.score === "number") {
      next.confidence = productionConfidence(confidence.score);
    }
  } else if (!next.confidence) {
    next.confidence = productionConfidence(0.65);
  }



  if (!Array.isArray(next.profession_meanings)) {

    next.profession_meanings = [];

  }

  if (!Array.isArray(next.examples)) {

    next.examples = [];

  }

  if (!Array.isArray(next.usage_notes)) {

    next.usage_notes = [];

  }

  if (!Array.isArray(next.related_terms)) {

    next.related_terms = [];

  }

  if (!Array.isArray(next.common_mistakes)) {

    next.common_mistakes = [];

  }



  if (!asRecord(next.pronunciation)) {

    next.pronunciation = {

      simple:

        typeof next.target_meaning === "string"

          ? next.target_meaning

          : query.input_text.trim(),

    };

  }



  if (typeof next.is_mock_data !== "boolean") {

    next.is_mock_data = false;

  }



  delete next.source;

  delete next.general_meaning_english;

  delete next.detailed_meaning_english;

  delete next.target_language_meaning;

  delete next.profession_specific_meaning;

  delete next.sample_sentences;

  delete next.confidence_score;



  return next;

}

