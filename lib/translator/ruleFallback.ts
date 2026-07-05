import { cleanTextForSpeech } from "@/lib/audio/speechText";
import { getLanguageByCode } from "@/lib/mock";
import { mockPhrasePacks } from "@/lib/mock/phrase-packs";
import {
  getPlaceholderTerm,
  normalizeSentence,
  resolvePlaceholderKey,
  swapPlaceholderInTarget,
  type PlaceholderKey,
} from "@/lib/offline/placeholderLexicon";
import type { OfflinePhrase, OfflinePhrasePack } from "@/lib/schemas";
import {
  findPhraseInPacks,
  getCanonicalEnglishForFallback,
} from "@/lib/translator/translationFallbacks";
import { buildCautionNote } from "@/lib/translator/translationShared";
import {
  coerceTranslatorResponse,
  getReliabilityLabel,
  type TranslatorRequest,
  type TranslatorResponse,
} from "@/lib/translator/translatorSchemas";

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
  {
    keywords: ["clinic", "hospital"],
    english: "Please take me to the nearest clinic.",
    priority: 6,
  },
  {
    keywords: ["road", "way", "direction"],
    english: "Where is the nearest road?",
    priority: 5,
  },
  { keywords: ["price", "much", "cost"], english: "How much is this?", priority: 5 },
  { keywords: ["safe", "safety"], english: "Is this place safe?", priority: 4 },
  { keywords: ["transport", "ride"], english: "I need transport.", priority: 4 },
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
  {
    id: "help_finding",
    regex: /^i need help finding (?:the )?(?:nearest )?(.+)$/i,
    baseEnglish: "Please take me to the nearest clinic.",
    basePlaceholder: "clinic",
    captureGroup: 1,
  },
];

function getPacksForTargetLanguage(targetLanguage: string): OfflinePhrasePack[] {
  const language = getLanguageByCode(targetLanguage);
  if (!language) return [];
  return mockPhrasePacks.filter((pack) => pack.language_id === language.id);
}

function findPhraseByEnglish(
  pack: OfflinePhrasePack,
  english: string,
): OfflinePhrase | undefined {
  const normalized = normalizeSentence(english);
  return pack.phrases.find(
    (phrase) => normalizeSentence(phrase.english) === normalized,
  );
}

function buildRuleResponse(
  request: TranslatorRequest,
  phrase: OfflinePhrase,
  options: {
    confidence: number;
    usageNote: string;
    diagnostics?: string;
  },
): TranslatorResponse | null {
  const translated = cleanTextForSpeech(phrase.target_text);

  return coerceTranslatorResponse({
    original_text: request.input_text.trim(),
    translated_text: translated,
    source_language: request.source_language,
    target_language: request.target_language,
    target_dialect: request.target_dialect ?? phrase.dialect_id,
    natural_translation: translated,
    pronunciation_simple: phrase.pronunciation_simple,
    usage_note: options.usageNote,
    confidence_score: options.confidence,
    validation_status: options.confidence < 0.6 ? "uncertain" : phrase.validation_status,
    source: "rule_fallback",
    reliability_label: getReliabilityLabel("rule_fallback", options.confidence),
    caution_note: buildCautionNote(request),
    diagnostics: options.diagnostics,
  });
}

function tryTemplateRule(
  request: TranslatorRequest,
  pack: OfflinePhrasePack,
  languageCode: string,
): TranslatorResponse | null {
  const normalized = normalizeSentence(request.input_text);

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
    return buildRuleResponse(request, { ...basePhrase, target_text: resolved }, {
      confidence: Math.min(0.75, basePhrase.confidence.score + 0.05),
      usageNote:
        "Pattern-based fallback using a known travel or emergency phrase structure.",
      diagnostics: `template:${rule.id}; placeholder:${placeholderKey}; term:${term ?? "n/a"}`,
    });
  }

  return null;
}

function tryKeywordRule(
  request: TranslatorRequest,
  pack: OfflinePhrasePack,
): TranslatorResponse | null {
  const normalized = normalizeSentence(request.input_text);
  const words = normalized.split(/\s+/);
  let best: { phrase: OfflinePhrase; priority: number } | null = null;

  for (const entry of KEYWORD_PHRASE_MAP) {
    const hit = entry.keywords.some(
      (keyword) => words.includes(keyword) || normalized.includes(keyword),
    );
    if (!hit) continue;

    const phrase = findPhraseByEnglish(pack, entry.english);
    if (!phrase) continue;

    if (!best || entry.priority > best.priority) {
      best = { phrase, priority: entry.priority };
    }
  }

  if (!best) return null;

  return buildRuleResponse(request, best.phrase, {
    confidence: Math.min(0.62, best.phrase.confidence.score),
    usageNote:
      "Matched a known emergency or travel keyword pattern. Meaning may be approximate for your full sentence.",
    diagnostics: `keyword:${best.phrase.english}`,
  });
}

function tryCanonicalPhraseRule(
  request: TranslatorRequest,
  packs: OfflinePhrasePack[],
): TranslatorResponse | null {
  const canonical = getCanonicalEnglishForFallback(request.input_text);
  if (!canonical) return null;

  const phrase = findPhraseInPacks(packs, canonical, request);
  if (!phrase) return null;

  return buildRuleResponse(request, phrase, {
    confidence: Math.min(0.68, phrase.confidence.score),
    usageNote: `Approximate match to known phrase: "${phrase.english}"`,
    diagnostics: `canonical:${canonical}`,
  });
}

export function tryRuleFallbackTranslation(
  request: TranslatorRequest,
): TranslatorResponse | null {
  if (!request.rule_fallback_enabled) return null;

  const packs = getPacksForTargetLanguage(request.target_language);
  if (packs.length === 0) return null;

  const orderedPacks = request.target_dialect
    ? [
        ...packs.filter((pack) => pack.dialect_id === request.target_dialect),
        ...packs.filter((pack) => pack.dialect_id !== request.target_dialect),
      ]
    : packs;

  for (const pack of orderedPacks) {
    const template = tryTemplateRule(request, pack, request.target_language);
    if (template) return template;
  }

  for (const pack of orderedPacks) {
    const keyword = tryKeywordRule(request, pack);
    if (keyword) return keyword;
  }

  return tryCanonicalPhraseRule(request, orderedPacks);
}
