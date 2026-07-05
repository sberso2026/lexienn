import { cleanTextForSpeech } from "@/lib/audio/speechText";

export const PLACEHOLDER_KEYS = [
  "road",
  "clinic",
  "water",
  "food",
  "market",
  "police_station",
  "transport",
  "boat",
  "motorcycle",
  "bridge",
  "house",
  "school",
] as const;

export type PlaceholderKey = (typeof PLACEHOLDER_KEYS)[number];

/** Seed-data fragments — only used with pack-based templates, not free generation. */
export const PLACEHOLDER_LEXICON: Record<
  PlaceholderKey,
  Record<string, string>
> = {
  road: {
    tl: "kalsada",
    ceb: "dalan",
    hil: "dalan",
  },
  clinic: {
    tl: "klinika",
    ceb: "klinika",
    hil: "klinika",
  },
  water: {
    tl: "tubig",
    ceb: "tubig",
    hil: "tubig",
  },
  food: {
    tl: "pagkain",
    ceb: "pagkaon",
    hil: "pagkaon",
  },
  market: {
    tl: "palengke",
    ceb: "merkado",
    hil: "merkado",
  },
  police_station: {
    tl: "istasyon ng pulis",
    ceb: "istasyon sa pulis",
    hil: "istasyon sang pulis",
  },
  transport: {
    tl: "sakay",
    ceb: "sakay",
    hil: "sakay",
  },
  boat: {
    tl: "bangka",
    ceb: "bangka",
    hil: "bangka",
  },
  motorcycle: {
    tl: "motorsiklo",
    ceb: "motor",
    hil: "motor",
  },
  bridge: {
    tl: "tulay",
    ceb: "tulay",
    hil: "tulay",
  },
  house: {
    tl: "bahay",
    ceb: "balay",
    hil: "balay",
  },
  school: {
    tl: "paaralan",
    ceb: "eskwelahan",
    hil: "eskwelahan",
  },
};

const PLACEHOLDER_ALIASES: Record<string, PlaceholderKey> = {
  road: "road",
  clinic: "clinic",
  hospital: "clinic",
  water: "water",
  food: "food",
  market: "market",
  "police station": "police_station",
  police: "police_station",
  transport: "transport",
  boat: "boat",
  motorcycle: "motorcycle",
  motorbike: "motorcycle",
  bridge: "bridge",
  house: "house",
  home: "house",
  school: "school",
};

export function normalizeSentence(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/g, "");
}

export function resolvePlaceholderKey(raw: string): PlaceholderKey | null {
  const normalized = raw.trim().toLowerCase().replace(/[.?]/g, "");
  return PLACEHOLDER_ALIASES[normalized] ?? null;
}

export function getPlaceholderTerm(
  key: PlaceholderKey,
  languageCode: string,
): string | null {
  return PLACEHOLDER_LEXICON[key][languageCode] ?? null;
}

export function swapPlaceholderInTarget(
  baseTarget: string,
  baseKey: PlaceholderKey,
  newKey: PlaceholderKey,
  languageCode: string,
): string | null {
  const baseTerm = getPlaceholderTerm(baseKey, languageCode);
  const newTerm = getPlaceholderTerm(newKey, languageCode);

  if (!baseTerm || !newTerm) return null;

  const cleaned = cleanTextForSpeech(baseTarget);
  if (!cleaned.toLowerCase().includes(baseTerm.toLowerCase())) {
    return null;
  }

  return cleaned.replace(new RegExp(baseTerm, "i"), newTerm);
}
