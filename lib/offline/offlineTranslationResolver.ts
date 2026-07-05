import { cleanTextForSpeech } from "@/lib/audio/speechText";
import type { OfflinePhrase, OfflinePhrasePack } from "@/lib/schemas";
import { offlineTranslationResultSchema } from "@/lib/schemas";
import type { OfflineTranslationResult } from "@/lib/schemas";
import {
  getPlaceholderTerm,
  normalizeSentence,
  resolvePlaceholderKey,
  swapPlaceholderInTarget,
  type PlaceholderKey,
} from "./placeholderLexicon";

const UNAVAILABLE_MESSAGE =
  "This sentence is not available in the downloaded offline pack. Try a simpler phrase.";

const KEYWORD_PHRASE_MAP: Array<{
  keywords: string[];
  english: string;
  priority: number;
}> = [
  { keywords: ["doctor", "medical"], english: "I need a doctor.", priority: 10 },
  { keywords: ["help", "emergency"], english: "I need help.", priority: 9 },
  { keywords: ["lost"], english: "I am lost.", priority: 8 },
  { keywords: ["water"], english: "I need water.", priority: 7 },
  { keywords: ["food", "hungry"], english: "I need food.", priority: 7 },
  { keywords: ["clinic", "hospital"], english: "Please take me to the nearest clinic.", priority: 6 },
  { keywords: ["road", "way", "direction"], english: "Where is the nearest road?", priority: 5 },
  { keywords: ["price", "much", "cost"], english: "How much is this?", priority: 5 },
  { keywords: ["safe", "safety"], english: "Is this place safe?", priority: 4 },
  { keywords: ["transport", "ride"], english: "I need transport.", priority: 4 },
  { keywords: ["bridge"], english: "We are here to inspect the bridge.", priority: 3 },
  { keywords: ["flood", "flooded"], english: "Has this road flooded before?", priority: 3 },
];

type TemplateRule = {
  id: string;
  regex: RegExp;
  baseEnglish: string;
  basePlaceholder: PlaceholderKey;
  captureGroup: number;
};

const TEMPLATE_RULES: TemplateRule[] = [
  {
    id: "where_is_nearest",
    regex: /^where is the nearest (.+)$/i,
    baseEnglish: "Where is the nearest road?",
    basePlaceholder: "road",
    captureGroup: 1,
  },
  {
    id: "i_need",
    regex: /^i need (.+)$/i,
    baseEnglish: "I need water.",
    basePlaceholder: "water",
    captureGroup: 1,
  },
  {
    id: "looking_for",
    regex: /^i am looking for (?:the )?(.+)$/i,
    baseEnglish: "Where is the nearest road?",
    basePlaceholder: "road",
    captureGroup: 1,
  },
  {
    id: "how_much",
    regex: /^how much is (.+)$/i,
    baseEnglish: "How much is this?",
    basePlaceholder: "food",
    captureGroup: 1,
  },
  {
    id: "help_with",
    regex: /^can you help me with (.+)$/i,
    baseEnglish: "I need help.",
    basePlaceholder: "water",
    captureGroup: 1,
  },
];

function buildPhraseIndex(pack: OfflinePhrasePack): Map<string, OfflinePhrase> {
  const index = new Map<string, OfflinePhrase>();

  for (const phrase of pack.phrases) {
    index.set(normalizeSentence(phrase.english), phrase);
  }

  return index;
}

function findPhraseByEnglish(
  pack: OfflinePhrasePack,
  english: string,
): OfflinePhrase | undefined {
  return pack.phrases.find(
    (phrase) => normalizeSentence(phrase.english) === normalizeSentence(english),
  );
}

function resultFromPhrase(
  original: string,
  phrase: OfflinePhrase,
  method: OfflineTranslationResult["resolution_method"],
  confidence: number,
  warning?: string,
  debugNote?: string,
): OfflineTranslationResult {
  return offlineTranslationResultSchema.parse({
    original_sentence: original,
    resolved_translation: cleanTextForSpeech(phrase.target_text),
    resolution_method: method,
    confidence_score: confidence,
    warning,
    matched_phrase_id: phrase.id,
    pronunciation_simple: phrase.pronunciation_simple,
    debug_note: debugNote,
  });
}

function tryExactMatch(
  sentence: string,
  normalized: string,
  index: Map<string, OfflinePhrase>,
): OfflineTranslationResult | null {
  const phrase = index.get(normalized);
  if (!phrase) return null;

  return resultFromPhrase(
    sentence,
    phrase,
    "exact_phrase",
    Math.min(0.95, phrase.confidence.score + 0.2),
    phrase.confidence.warning,
    "Matched exact phrase from downloaded pack.",
  );
}

function tryTemplateMatch(
  sentence: string,
  normalized: string,
  pack: OfflinePhrasePack,
  languageCode: string,
): OfflineTranslationResult | null {
  for (const rule of TEMPLATE_RULES) {
    const match = normalized.match(rule.regex);
    if (!match) continue;

    const captured = match[rule.captureGroup];
    const placeholderKey = resolvePlaceholderKey(captured);
    if (!placeholderKey) continue;

    const basePhrase = findPhraseByEnglish(pack, rule.baseEnglish);
    if (!basePhrase) continue;

    let resolved: string | null = null;

    if (placeholderKey === rule.basePlaceholder) {
      resolved = cleanTextForSpeech(basePhrase.target_text);
    } else {
      resolved = swapPlaceholderInTarget(
        basePhrase.target_text,
        rule.basePlaceholder,
        placeholderKey,
        languageCode,
      );
    }

    if (!resolved) continue;

    const term = getPlaceholderTerm(placeholderKey, languageCode);
    return offlineTranslationResultSchema.parse({
      original_sentence: sentence,
      resolved_translation: resolved,
      resolution_method: "template",
      confidence_score: Math.min(0.75, basePhrase.confidence.score + 0.05),
      warning:
        "Template match using pack phrase structure. Native speaker validation recommended.",
      matched_phrase_id: basePhrase.id,
      pronunciation_simple: basePhrase.pronunciation_simple,
      debug_note: `Template ${rule.id} · placeholder: ${placeholderKey} → ${term}`,
    });
  }

  return null;
}

function tryKeywordFallback(
  sentence: string,
  normalized: string,
  pack: OfflinePhrasePack,
): OfflineTranslationResult | null {
  const words = normalized.split(/\s+/);
  let best: { phrase: OfflinePhrase; priority: number } | null = null;

  for (const entry of KEYWORD_PHRASE_MAP) {
    const hit = entry.keywords.some((keyword) => words.includes(keyword));
    if (!hit) continue;

    const phrase = findPhraseByEnglish(pack, entry.english);
    if (!phrase) continue;

    if (!best || entry.priority > best.priority) {
      best = { phrase, priority: entry.priority };
    }
  }

  if (!best) return null;

  return resultFromPhrase(
    sentence,
    best.phrase,
    "keyword_fallback",
    Math.min(0.55, best.phrase.confidence.score),
    "Keyword fallback — meaning may not match your full sentence exactly.",
    `Keywords matched pack phrase: ${best.phrase.english}`,
  );
}

function trySimplifiedSuggestion(
  sentence: string,
  normalized: string,
  pack: OfflinePhrasePack,
): OfflineTranslationResult | null {
  const inputWords = new Set(normalized.split(/\s+/).filter((w) => w.length > 2));

  let best: { phrase: OfflinePhrase; score: number } | null = null;

  for (const phrase of pack.phrases) {
    const phraseWords = normalizeSentence(phrase.english)
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const overlap = phraseWords.filter((word) => inputWords.has(word)).length;
    if (overlap === 0) continue;

    if (!best || overlap > best.score) {
      best = { phrase, score: overlap };
    }
  }

  if (!best || best.score < 2) return null;

  return offlineTranslationResultSchema.parse({
    original_sentence: sentence,
    resolved_translation: cleanTextForSpeech(best.phrase.target_text),
    resolution_method: "simplified_suggestion",
    confidence_score: 0.35,
    warning: `No reliable offline match. Closest pack phrase: "${best.phrase.english}"`,
    matched_phrase_id: best.phrase.id,
    pronunciation_simple: best.phrase.pronunciation_simple,
    debug_note: `Word overlap score: ${best.score}`,
  });
}

function unavailableResult(sentence: string): OfflineTranslationResult {
  return offlineTranslationResultSchema.parse({
    original_sentence: sentence,
    resolved_translation: UNAVAILABLE_MESSAGE,
    resolution_method: "unavailable",
    confidence_score: 0.1,
    warning: "No offline translation available for this sentence.",
    debug_note: "No exact, template, keyword, or suggestion match.",
  });
}

/**
 * Resolve an English sentence offline using downloaded phrase pack data only.
 * Priority: exact phrase → template → keyword → simplified suggestion → unavailable.
 */
export function resolveOfflineTranslation(
  sentence: string,
  pack: OfflinePhrasePack,
  languageCode: string,
): OfflineTranslationResult {
  const trimmed = sentence.trim();
  if (!trimmed) {
    return unavailableResult(sentence);
  }

  const normalized = normalizeSentence(trimmed);
  const index = buildPhraseIndex(pack);

  return (
    tryExactMatch(trimmed, normalized, index) ??
    tryTemplateMatch(trimmed, normalized, pack, languageCode) ??
    tryKeywordFallback(trimmed, normalized, pack) ??
    trySimplifiedSuggestion(trimmed, normalized, pack) ??
    unavailableResult(trimmed)
  );
}
