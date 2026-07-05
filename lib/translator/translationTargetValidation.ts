import {
  isLikelyPhilippineLinguaFrancaOutput,
  isLikelyVerifiedBlaanOutput,
} from "@/lib/languages/blaanVerifiedPhrases";
import { isBlaanTarget } from "@/lib/languages/philippineIndigenousLanguages";
import {
  isAustralianEnglishTarget,
  isIndigenousAustralianTarget,
} from "@/lib/languages/languageOptions";
import { isEnglishLanguage } from "@/lib/translator/translationShared";
import type { TranslatorRequest, TranslatorResponse } from "@/lib/translator/translatorSchemas";

function normalizeComparableText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\bwanna\b/g, "want to")
    .replace(/\bgonna\b/g, "going to")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeComparableText(text).split(" ").filter(Boolean);
}

function overlapRatio(source: string, translated: string): number {
  const sourceTokens = new Set(tokenize(source));
  const translatedTokens = tokenize(translated);
  if (translatedTokens.length === 0) return 1;

  const shared = translatedTokens.filter((token) => sourceTokens.has(token)).length;
  return shared / translatedTokens.length;
}

function levenshteinRatio(a: string, b: string): number {
  const left = normalizeComparableText(a);
  const right = normalizeComparableText(b);
  if (left === right) return 1;
  if (!left || !right) return 0;

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const distance = matrix[rows - 1][cols - 1];
  return 1 - distance / Math.max(left.length, right.length);
}

export function requiresNonEnglishTranslationOutput(request: TranslatorRequest): boolean {
  if (isAustralianEnglishTarget(request)) return false;

  if (
    isEnglishLanguage(request.source_language) &&
    isEnglishLanguage(request.target_language) &&
    !request.target_language_selection
  ) {
    return false;
  }

  if (isIndigenousAustralianTarget(request)) return true;

  return (
    isEnglishLanguage(request.source_language) &&
    !isEnglishLanguage(request.target_language)
  );
}

export function isLikelyEnglishRewrite(sourceText: string, translatedText: string): boolean {
  const source = sourceText.trim();
  const translated = translatedText.trim();
  if (!source || !translated) return true;

  const normalizedSource = normalizeComparableText(source);
  const normalizedTranslated = normalizeComparableText(translated);
  if (normalizedSource === normalizedTranslated) return true;

  const similarity = levenshteinRatio(source, translated);
  const overlap = overlapRatio(source, translated);

  return similarity >= 0.72 || overlap >= 0.8;
}

export function requiresVerifiedBlaanTranslation(request: TranslatorRequest): boolean {
  return isBlaanTarget(request);
}

export function isValidBlaanTranslationOutput(
  response: Pick<TranslatorResponse, "translated_text" | "natural_translation">,
): boolean {
  const translated = response.translated_text.trim() || response.natural_translation.trim();
  if (!translated) return false;
  if (isLikelyPhilippineLinguaFrancaOutput(translated)) return false;
  return isLikelyVerifiedBlaanOutput(translated);
}

export function isValidTargetLanguageOutput(
  request: TranslatorRequest,
  response: Pick<TranslatorResponse, "translated_text" | "natural_translation">,
): boolean {
  if (requiresVerifiedBlaanTranslation(request)) {
    return isValidBlaanTranslationOutput(response);
  }

  if (!requiresNonEnglishTranslationOutput(request)) return true;

  const translated = response.translated_text.trim() || response.natural_translation.trim();
  if (!translated) return false;

  return !isLikelyEnglishRewrite(request.input_text, translated);
}
