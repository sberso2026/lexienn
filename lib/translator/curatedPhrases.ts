import { normalizeLookupCandidates } from "@/lib/text/normalizeLookupText";

export type CuratedPhraseEntry = {
  id: string;
  /** Normalized English lookup keys (lowercase, no outer punctuation). */
  source_keys: string[];
  /** ISO-style language codes this phrase applies to (e.g. tl). */
  target_languages: string[];
  translated_text: string;
  pronunciation_simple: string;
  usage_note?: string;
};

export const CURATED_PHRASE_ENTRIES: CuratedPhraseEntry[] = [
  {
    id: "curated-whats-your-name",
    source_keys: ["what's your name", "whats your name", "what is your name"],
    target_languages: ["tl"],
    translated_text: "Ano ang pangalan mo?",
    pronunciation_simple: "AH-no ang pang-NA-lan mo",
    usage_note: "Common way to ask someone's name in Filipino / Tagalog.",
  },
  {
    id: "curated-my-name-is",
    source_keys: ["my name is"],
    target_languages: ["tl"],
    translated_text: "Ang pangalan ko ay",
    pronunciation_simple: "Ang pang-NA-lan ko ay",
    usage_note: "Introduce your name; add your name after this phrase.",
  },
  {
    id: "curated-how-are-you",
    source_keys: ["how are you"],
    target_languages: ["tl"],
    translated_text: "Kumusta ka?",
    pronunciation_simple: "koo-MOOS-tah kah",
  },
  {
    id: "curated-thank-you",
    source_keys: ["thank you", "thanks"],
    target_languages: ["tl"],
    translated_text: "Salamat",
    pronunciation_simple: "sah-LAH-mat",
  },
  {
    id: "curated-where-is-toilet",
    source_keys: ["where is the toilet", "where is the bathroom"],
    target_languages: ["tl"],
    translated_text: "Saan ang palikuran?",
    pronunciation_simple: "Sah-AN ang pah-lee-KOO-ran",
  },
  {
    id: "curated-how-much-is-this",
    source_keys: ["how much is this", "how much"],
    target_languages: ["tl"],
    translated_text: "Magkano ito?",
    pronunciation_simple: "mag-KA-no EE-to",
  },
  {
    id: "curated-i-need-help",
    source_keys: ["i need help"],
    target_languages: ["tl"],
    translated_text: "Kailangan ko ng tulong",
    pronunciation_simple: "Kah-ee-LAH-ngan ko nang too-LOONG",
  },
  {
    id: "curated-i-need-doctor",
    source_keys: ["i need a doctor"],
    target_languages: ["tl"],
    translated_text: "Kailangan ko ng doktor",
    pronunciation_simple: "Kah-ee-LAH-ngan ko nang DOK-tor",
  },
  {
    id: "curated-where-are-you-going",
    source_keys: ["where are you going"],
    target_languages: ["tl"],
    translated_text: "Saan ka pupunta?",
    pronunciation_simple: "Sah-AN kah poo-POON-tah",
  },
  {
    id: "curated-good-morning",
    source_keys: ["good morning"],
    target_languages: ["tl"],
    translated_text: "Magandang umaga",
    pronunciation_simple: "mah-gahn-DAHNG oo-MAH-gah",
  },
  {
    id: "curated-good-afternoon",
    source_keys: ["good afternoon"],
    target_languages: ["tl"],
    translated_text: "Magandang hapon",
    pronunciation_simple: "mah-gahn-DAHNG HAH-pon",
  },
  {
    id: "curated-good-evening",
    source_keys: ["good evening"],
    target_languages: ["tl"],
    translated_text: "Magandang gabi",
    pronunciation_simple: "mah-gahn-DAHNG GAH-bee",
  },
  {
    id: "curated-yes",
    source_keys: ["yes"],
    target_languages: ["tl"],
    translated_text: "Oo",
    pronunciation_simple: "OH-oh",
  },
  {
    id: "curated-no",
    source_keys: ["no"],
    target_languages: ["tl"],
    translated_text: "Hindi",
    pronunciation_simple: "HIN-dee",
  },
  {
    id: "curated-water-word",
    source_keys: ["water"],
    target_languages: ["tl"],
    translated_text: "tubig",
    pronunciation_simple: "TOO-big",
    usage_note: "Curated word translation from English to Filipino / Tagalog.",
  },
  {
    id: "curated-food-word",
    source_keys: ["food"],
    target_languages: ["tl"],
    translated_text: "pagkain",
    pronunciation_simple: "pag-KAH-in",
  },
  {
    id: "curated-house-word",
    source_keys: ["house"],
    target_languages: ["tl"],
    translated_text: "bahay",
    pronunciation_simple: "bah-HAY",
  },
];

const curatedPhraseIndex = new Map<string, CuratedPhraseEntry>();

for (const entry of CURATED_PHRASE_ENTRIES) {
  for (const key of entry.source_keys) {
    curatedPhraseIndex.set(key, entry);
  }
}

export function findCuratedPhrase(
  inputText: string,
  targetLanguage: string,
): CuratedPhraseEntry | undefined {
  const lang = targetLanguage.toLowerCase();
  for (const candidate of normalizeLookupCandidates(inputText)) {
    const entry = curatedPhraseIndex.get(candidate);
    if (entry && entry.target_languages.includes(lang)) {
      return entry;
    }
  }
  return undefined;
}
