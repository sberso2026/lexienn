import { normalizeSentence } from "@/lib/offline/placeholderLexicon";
import type { OfflinePhrase, OfflinePhrasePack } from "@/lib/schemas";
import type { TranslatorRequest } from "./translatorSchemas";

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
    keywords: ["road", "street", "highway", "kalsada"],
    english: "Where is the nearest road?",
    priority: 5,
  },
  {
    keywords: ["church", "simbahan"],
    english: "Which way to church?",
    priority: 8,
  },
  { keywords: ["price", "much", "cost"], english: "How much is this?", priority: 5 },
  { keywords: ["safe", "safety"], english: "Is this place safe?", priority: 4 },
  { keywords: ["transport", "ride"], english: "I need transport.", priority: 4 },
];

export function getCanonicalEnglishForFallback(input: string): string | null {
  const normalized = normalizeSentence(input);
  let best: { english: string; priority: number } | null = null;

  for (const rule of KEYWORD_PHRASE_MAP) {
    if (!rule.keywords.some((keyword) => normalized.includes(keyword))) continue;
    if (!best || rule.priority > best.priority) {
      best = { english: rule.english, priority: rule.priority };
    }
  }

  return best?.english ?? null;
}

export function findPhraseInPacks(
  packs: OfflinePhrasePack[],
  english: string,
  request: Pick<TranslatorRequest, "target_dialect">,
): OfflinePhrase | null {
  const normalized = normalizeSentence(english);

  const orderedPacks = request.target_dialect
    ? [
        ...packs.filter((pack) => pack.dialect_id === request.target_dialect),
        ...packs.filter((pack) => pack.dialect_id !== request.target_dialect),
      ]
    : packs;

  for (const pack of orderedPacks) {
    const phrase = pack.phrases.find(
      (item) => normalizeSentence(item.english) === normalized,
    );
    if (phrase) return phrase;
  }

  return null;
}

export function tryFallbackPhraseMatch(
  packs: OfflinePhrasePack[],
  request: TranslatorRequest,
): OfflinePhrase | null {
  const canonical = getCanonicalEnglishForFallback(request.input_text);
  if (!canonical) return null;
  return findPhraseInPacks(packs, canonical, request);
}
