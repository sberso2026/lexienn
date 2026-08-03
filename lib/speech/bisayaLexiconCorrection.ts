import { BISAYA_STT_VOCABULARY } from "@/lib/speech/bisayaStt";

/**
 * Cebuano lexicon post-correction.
 * Uses token / multi-token phonetic similarity — not blind global replace.
 */

const LEXICON = new Set<string>([
  ...BISAYA_STT_VOCABULARY,
  "pag-amping",
  "amping-amping",
]);

/** Known multi-token English phonetic guesses → Cebuano. */
const MULTI_TOKEN_CONFUSIONS: Array<{
  tokens: string[];
  replacement: string;
}> = [
  { tokens: ["im", "ping"], replacement: "amping" },
  { tokens: ["im", "bing"], replacement: "amping" },
  { tokens: ["i", "m", "ping"], replacement: "amping" },
  { tokens: ["i", "m", "bing"], replacement: "amping" },
  { tokens: ["i", "am", "ping"], replacement: "amping" },
  { tokens: ["i", "am", "bing"], replacement: "amping" },
  { tokens: ["aim", "ping"], replacement: "amping" },
  { tokens: ["aim", "bing"], replacement: "amping" },
];

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Normalize a token for phonetic comparison. */
export function normalizeBisayaToken(token: string): string {
  return stripDiacritics(token)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/^i\s*m$/, "im")
    .replace(/[^a-z0-9-]/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cur = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length]!;
}

export function tokenSimilarity(a: string, b: string): number {
  const left = normalizeBisayaToken(a);
  const right = normalizeBisayaToken(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(left, right) / maxLen;
}

function bestLexiconMatch(token: string): { word: string; score: number } | null {
  const normalized = normalizeBisayaToken(token);
  if (!normalized) return null;
  if (LEXICON.has(normalized)) return { word: normalized, score: 1 };

  let best: { word: string; score: number } | null = null;
  for (const word of LEXICON) {
    const score = tokenSimilarity(normalized, word);
    if (!best || score > best.score) best = { word, score };
  }
  return best;
}

/**
 * Correct likely STT confusions toward Cebuano lexicon entries.
 * Example: "I'm ping" / "I'm bing" / "ampingg" → "amping"
 */
export function correctBisayaTranscript(transcript: string): {
  transcript: string;
  corrections: Array<{ from: string; to: string }>;
} {
  const raw = transcript.replace(/\s+/g, " ").trim();
  if (!raw) return { transcript: raw, corrections: [] };

  const parts = raw.match(/[A-Za-zÀ-ÿ0-9'-]+|[^\sA-Za-zÀ-ÿ0-9']/g) ?? [raw];
  const wordIndexes: number[] = [];
  const words: string[] = [];

  parts.forEach((part, index) => {
    if (/[A-Za-zÀ-ÿ0-9]/.test(part)) {
      wordIndexes.push(index);
      words.push(part);
    }
  });

  const corrections: Array<{ from: string; to: string }> = [];
  const replacedWord = new Array(words.length).fill(false);

  // Multi-token windows first (I'm ping).
  for (const confusion of MULTI_TOKEN_CONFUSIONS) {
    const n = confusion.tokens.length;
    for (let i = 0; i <= words.length - n; i += 1) {
      if (replacedWord.slice(i, i + n).some(Boolean)) continue;
      const windowNorm = words
        .slice(i, i + n)
        .map((w) => normalizeBisayaToken(w));
      const targetNorm = confusion.tokens;
      const matched = targetNorm.every((token, idx) => {
        const got = windowNorm[idx] ?? "";
        return got === token || tokenSimilarity(got, token) >= 0.84;
      });
      // Also accept phonetic collapse: im+ping ≈ amping
      const collapsed = windowNorm.join("");
      const collapseScore = tokenSimilarity(collapsed, confusion.replacement);
      if (!matched && collapseScore < 0.78) continue;

      const from = words.slice(i, i + n).join(" ");
      for (let k = 0; k < n; k += 1) {
        const partIndex = wordIndexes[i + k]!;
        if (k === 0) {
          parts[partIndex] = confusion.replacement;
        } else {
          parts[partIndex] = "";
          // Clear adjacent space left by removed tokens.
          const prev = partIndex - 1;
          if (prev >= 0 && parts[prev] === " ") parts[prev] = "";
        }
        replacedWord[i + k] = true;
      }
      corrections.push({ from, to: confusion.replacement });
    }
  }

  // Single-token lexicon correction (ampingg → amping).
  for (let i = 0; i < words.length; i += 1) {
    if (replacedWord[i]) continue;
    const word = words[i]!;
    const match = bestLexiconMatch(word);
    if (!match) continue;
    const normalized = normalizeBisayaToken(word);
    // High bar except for near-duplicates / trailing g / punctuation-stripped equals.
    const shouldCorrect =
      match.score >= 0.84 ||
      (match.word === "amping" &&
        (normalized === "ampingg" ||
          normalized === "amping" ||
          tokenSimilarity(normalized, "amping") >= 0.8));
    if (!shouldCorrect || match.word === normalized) continue;
    const partIndex = wordIndexes[i]!;
    const original = parts[partIndex]!;
    // Preserve simple capitalization of first letter when original was Title case.
    const corrected =
      /^[A-Z]/.test(original) && match.word.length > 0
        ? match.word[0]!.toUpperCase() + match.word.slice(1)
        : match.word;
    parts[partIndex] = corrected;
    corrections.push({ from: original, to: corrected });
    replacedWord[i] = true;
  }

  const next = parts.join("").replace(/\s+/g, " ").trim();
  return { transcript: next, corrections };
}

/** Score how Cebuano-like a Latin transcript is (0–1). */
export function scoreCebuanoLexicalOverlap(transcript: string): number {
  const tokens = transcript
    .split(/\s+/)
    .map((token) => normalizeBisayaToken(token))
    .filter(Boolean);
  if (tokens.length === 0) return 0;

  let hits = 0;
  for (const token of tokens) {
    const match = bestLexiconMatch(token);
    if (match && match.score >= 0.84) hits += 1;
    else if (
      /^(ka|ko|mo|og|ang|sa|ni|nga|ug|na|pa|ba|ra|man|lang|kay|pod|pud)$/.test(
        token,
      )
    ) {
      hits += 0.5;
    }
  }
  return Math.min(1, hits / tokens.length);
}

/** Generate local STT hint variants for a taught phrase (text only). */
export function generateBisayaTeachVariants(phrase: string): string[] {
  const cleaned = phrase.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const lower = cleaned.toLowerCase();
  const noPunct = lower.replace(/[?!.,;:]+$/g, "").trim();
  const variants = new Set<string>([cleaned, lower, noPunct]);

  // Common amping surface forms that should map back via hints.
  if (noPunct === "amping" || noPunct.endsWith(" amping") || noPunct.startsWith("amping ")) {
    variants.add("amping");
    variants.add("amping.");
    variants.add("pag-amping");
    variants.add("amping mo");
    variants.add("amping kanunay");
  }

  return [...variants].filter(Boolean).slice(0, 12);
}
