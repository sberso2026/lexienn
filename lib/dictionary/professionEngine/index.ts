import type {
  DictionaryEntry,
  DictionaryQuery,
  ExampleSentence,
  ProfessionMeaning,
  UserContext,
} from "@/lib/schemas";
import { dictionaryEntrySchema } from "@/lib/schemas";
import { cautionForContext, normalizeInputKey, resolveContext } from "./constants";
import { CURATED_PROFESSION_DATA } from "./data";

function getCuratedContextData(inputText: string, context: UserContext) {
  const key = normalizeInputKey(inputText);
  const resolvedContext = resolveContext(context) as UserContext;
  return {
    key,
    resolvedContext,
    termData: CURATED_PROFESSION_DATA[key],
    contextData: CURATED_PROFESSION_DATA[key]?.[resolvedContext],
  };
}

function genericProfessionMeaning(
  inputText: string,
  context: UserContext,
): ProfessionMeaning {
  const resolvedContext = resolveContext(context) as UserContext;
  const label = resolvedContext.replace(/_/g, " ");

  return {
    context: resolvedContext,
    meaning_en: `In a ${label} setting, "${inputText.trim()}" may have specialized usage not yet curated in the dictionary. Refer to the general meaning above.`,
    caution_note: cautionForContext(resolvedContext),
  };
}

/**
 * Deterministic profession-aware meaning for a word/phrase and user context.
 */
export function getProfessionAwareMeaning(
  inputText: string,
  context: UserContext,
): ProfessionMeaning {
  const { contextData } = getCuratedContextData(inputText, context);

  if (contextData) {
    return {
      context,
      meaning_en: contextData.meaning_en,
      caution_note:
        contextData.caution_note ?? cautionForContext(resolveContext(context)),
    };
  }

  return {
    ...genericProfessionMeaning(inputText, resolveContext(context) as UserContext),
    context,
  };
}

/**
 * Context-specific sample sentences from curated profession data.
 */
export function getContextSpecificExamples(
  inputText: string,
  context: UserContext,
): ExampleSentence[] {
  const { contextData } = getCuratedContextData(inputText, context);
  return contextData?.examples ?? [];
}

/**
 * Related professional terms for the input and context.
 */
export function getRelatedProfessionalTerms(
  inputText: string,
  context: UserContext,
): string[] {
  const { contextData } = getCuratedContextData(inputText, context);
  return contextData?.related_terms ?? [];
}

/**
 * Common mistakes for the input in a given professional context.
 */
export function getCommonContextMistakes(
  inputText: string,
  context: UserContext,
): string[] {
  const { contextData } = getCuratedContextData(inputText, context);
  return contextData?.common_mistakes ?? [];
}

function mergeUniqueStrings(primary: string[], secondary: string[]): string[] {
  return [...new Set([...primary, ...secondary])];
}

function mergeExamples(
  contextExamples: ExampleSentence[],
  existing: ExampleSentence[],
): ExampleSentence[] {
  const seen = new Set<string>();
  const merged: ExampleSentence[] = [];

  for (const example of [...contextExamples, ...existing]) {
    const key = `${example.language_code}:${example.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(example);
  }

  return merged;
}

function upsertProfessionMeaning(
  meanings: ProfessionMeaning[],
  meaning: ProfessionMeaning,
): ProfessionMeaning[] {
  const next = meanings.filter((item) => item.context !== meaning.context);
  return [meaning, ...next];
}

/**
 * Enrich a dictionary entry with profession-aware data for the selected query context.
 */
export function enrichEntryWithProfessionContext(
  entry: DictionaryEntry,
  query: DictionaryQuery,
): DictionaryEntry {
  const context = query.user_context;
  const professionMeaning = getProfessionAwareMeaning(entry.input_text, context);
  const contextExamples = getContextSpecificExamples(entry.input_text, context);
  const relatedTerms = getRelatedProfessionalTerms(entry.input_text, context);
  const mistakes = getCommonContextMistakes(entry.input_text, context);

  return dictionaryEntrySchema.parse({
    ...entry,
    profession_meanings: upsertProfessionMeaning(
      entry.profession_meanings,
      professionMeaning,
    ),
    examples: mergeExamples(contextExamples, entry.examples),
    related_terms: mergeUniqueStrings(relatedTerms, entry.related_terms),
    common_mistakes: mergeUniqueStrings(mistakes, entry.common_mistakes),
  });
}
