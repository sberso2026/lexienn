const CURLY_APOSTROPHE = /[\u2018\u2019\u201B]/g;

const CONTRACTION_EXPANSIONS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bwhat's\b/g, replacement: "what is" },
  { pattern: /\bwhats\b/g, replacement: "what is" },
  { pattern: /\bi'm\b/g, replacement: "i am" },
  { pattern: /\bim\b/g, replacement: "i am" },
  { pattern: /\byou're\b/g, replacement: "you are" },
  { pattern: /\byoure\b/g, replacement: "you are" },
  { pattern: /\bdon't\b/g, replacement: "do not" },
  { pattern: /\bdont\b/g, replacement: "do not" },
  { pattern: /\bcan't\b/g, replacement: "cannot" },
  { pattern: /\bcant\b/g, replacement: "cannot" },
];

function stripOuterPunctuation(text: string): string {
  return text.replace(/^[^a-z0-9' ]+|[^a-z0-9' ]+$/g, "");
}

function expandContractions(text: string): string {
  let expanded = text;
  for (const { pattern, replacement } of CONTRACTION_EXPANSIONS) {
    expanded = expanded.replace(pattern, replacement);
  }
  return expanded.replace(/\s+/g, " ").trim();
}

/**
 * Normalize lookup text for curated dictionary and phrase matching.
 */
export function normalizeLookupText(input: string): string {
  const text = input
    .trim()
    .replace(CURLY_APOSTROPHE, "'")
    .toLowerCase()
    .replace(/\s+/g, " ");

  return stripOuterPunctuation(text);
}

/**
 * Return normalized lookup variants, including apostrophe-free and
 * contraction-expanded forms (e.g. "what's your name" → "what is your name").
 */
export function normalizeLookupCandidates(input: string): string[] {
  const primary = normalizeLookupText(input);
  const candidates = new Set<string>();

  if (primary) {
    candidates.add(primary);
    const withoutApostrophe = primary.replace(/'/g, "");
    if (withoutApostrophe) {
      candidates.add(withoutApostrophe);
    }
    const expanded = expandContractions(primary);
    if (expanded) {
      candidates.add(expanded);
      const expandedWithoutApostrophe = expanded.replace(/'/g, "");
      if (expandedWithoutApostrophe) {
        candidates.add(expandedWithoutApostrophe);
      }
    }
  }

  return [...candidates];
}

/**
 * Glossary lookup variants including simple plural stripping on the last word.
 * e.g. "tie beams" → "tie beam", "footings" → "footing"
 */
export function normalizeGlossaryLookupCandidates(input: string): string[] {
  const base = normalizeLookupCandidates(input);
  const extended = new Set<string>(base);

  for (const candidate of base) {
    if (candidate.endsWith("s") && candidate.length > 3 && !candidate.endsWith("ss")) {
      extended.add(candidate.slice(0, -1));
    }
    const words = candidate.split(" ");
    if (words.length > 1) {
      const last = words[words.length - 1];
      if (last.endsWith("s") && last.length > 2 && !last.endsWith("ss")) {
        words[words.length - 1] = last.slice(0, -1);
        extended.add(words.join(" "));
      }
    }
  }

  return [...extended];
}
