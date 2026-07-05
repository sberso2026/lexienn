export type BlaanVerifiedPhrase = {
  id: string;
  /** Dialect ids from mock dialect catalog; empty means all B'laan dialects. */
  dialect_ids: string[];
  sources: string[];
  english: string[];
  tagalog: string[];
  blaan: string;
  pronunciation_simple: string;
  usage_note?: string;
};

/**
 * Curated B'laan phrases from documented community references.
 * Do not add entries without a cited source — expand this catalog over time.
 */
export const BLAAN_VERIFIED_PHRASES: BlaanVerifiedPhrase[] = [
  {
    id: "blaan-teeth-big",
    dialect_ids: ["dialect-blaan-koronadal", "dialect-blaan-sarangani"],
    sources: [
      "Reid, L.A. (ed.) (1971). Philippine Minor Languages: Word Lists and Phonologies. Oceanic Linguistics Special Publication 8. Abrams (1966) Koronadal Blaan wordlist — ngipen 'tooth'.",
      "B'laan community usage attested by Lexienn user correction (South Cotabato/Sarangani, 2026) — full phrase Fetew le ngipen nu.",
    ],
    english: ["your teeth are big", "you have big teeth"],
    tagalog: ["malaki ang ngipin mo", "malaki ang ngipin nyo", "malaki ngipin mo"],
    blaan: "Fetew le ngipen nu",
    pronunciation_simple: "Feh-tew leh ngih-pen noo",
    usage_note: "Verified B'laan phrasing for a comment about large teeth.",
  },
];

export const BLAAN_NO_INVENTION_RULES =
  "Do NOT invent B'laan words or guess from Tagalog, Filipino, Cebuano, Bisaya, Hiligaynon, or Ilocano. Use ONLY verified B'laan references supplied in this request. If no verified reference applies, return empty translated_text, set validation_status to uncertain, lower confidence_score, and explain in usage_note that no verified B'laan equivalent is available yet.";

function normalizePhraseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function phraseMatchesInput(input: string, candidates: string[]): boolean {
  const normalizedInput = normalizePhraseText(input);
  return candidates.some((candidate) => normalizePhraseText(candidate) === normalizedInput);
}

export function findBlaanVerifiedPhrase(
  inputText: string,
  dialectId?: string,
): BlaanVerifiedPhrase | undefined {
  const trimmed = inputText.trim();
  if (!trimmed) return undefined;

  return BLAAN_VERIFIED_PHRASES.find((phrase) => {
    if (dialectId && phrase.dialect_ids.length > 0 && !phrase.dialect_ids.includes(dialectId)) {
      return false;
    }

    return (
      phraseMatchesInput(trimmed, phrase.english) ||
      phraseMatchesInput(trimmed, phrase.tagalog)
    );
  });
}

export function buildBlaanVerifiedReferencePromptBlock(dialectId?: string): string {
  const phrases = BLAAN_VERIFIED_PHRASES.filter(
    (phrase) =>
      !dialectId ||
      phrase.dialect_ids.length === 0 ||
      phrase.dialect_ids.includes(dialectId),
  );

  if (phrases.length === 0) {
    return "VERIFIED B'LAAN REFERENCES: (none loaded for this dialect yet.)";
  }

  const lines = phrases.map(
    (phrase) =>
      `- id: ${phrase.id}\n  B'laan: ${phrase.blaan}\n  English: ${phrase.english.join(" | ")}\n  Tagalog: ${phrase.tagalog.join(" | ")}\n  Sources: ${phrase.sources.join("; ")}`,
  );

  return ["VERIFIED B'LAAN REFERENCES (use only these attested forms):", ...lines].join("\n");
}

const TAGALOG_FUNCTION_WORDS =
  /\b(ang|mga|ng|sa|ko|mo|niya|namin|natin|nila|kami|kayo|sila|ba|po|ho|ay|na|yung|iyong|ito|iyan|dito|doon)\b/i;

const TAGALOG_CONTENT_WORDS =
  /\b(malaki|maliit|maganda|salamat|kumusta|ngipin|mahal|masaya|tubig|bahay|araw|gabi)\b/i;

const CEBUANO_BISAYA_MARKERS =
  /\b(kaayo|nimo|nako|nimo|kanako|kana|maayo|dagko|unsa|asa|diin|palangga|gwapo|ngipon|bisaya|cebuano)\b/i;

const HILIGAYNON_MARKERS = /\b(ilonggo|hiligaynon|palangga|gwapo|dako|maayo guid)\b/i;

export function isLikelyPhilippineLinguaFrancaOutput(text: string): boolean {
  const normalized = normalizePhraseText(text);
  if (!normalized) return false;

  if (TAGALOG_FUNCTION_WORDS.test(normalized)) return true;
  if (TAGALOG_CONTENT_WORDS.test(normalized)) return true;
  if (CEBUANO_BISAYA_MARKERS.test(normalized)) return true;
  if (HILIGAYNON_MARKERS.test(normalized)) return true;

  return false;
}

export function isLikelyVerifiedBlaanOutput(text: string): boolean {
  const normalized = normalizePhraseText(text);
  if (!normalized) return false;

  return BLAAN_VERIFIED_PHRASES.some(
    (phrase) => normalizePhraseText(phrase.blaan) === normalized,
  );
}
