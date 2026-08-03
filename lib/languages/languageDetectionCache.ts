import { getCachedResult, setCachedResult } from "@/lib/request/requestCache";
import type { LanguageDetectionPipelineResult } from "@/lib/languages/languageDetectionTypes";

const CACHE_PREFIX = "langdetect:v1:";
const DEFAULT_TTL_MS = 1000 * 60 * 60;

export function normalizeDetectionCacheKey(transcript: string): string {
  return `${CACHE_PREFIX}${transcript
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[?!.,:;…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()}`;
}

export function getCachedLanguageDetection(
  transcript: string,
): LanguageDetectionPipelineResult | null {
  const key = normalizeDetectionCacheKey(transcript);
  if (key.length <= CACHE_PREFIX.length) return null;
  return getCachedResult<LanguageDetectionPipelineResult>(key);
}

export function setCachedLanguageDetection(
  transcript: string,
  result: LanguageDetectionPipelineResult,
  ttlMs = DEFAULT_TTL_MS,
): void {
  const key = normalizeDetectionCacheKey(transcript);
  if (key.length <= CACHE_PREFIX.length) return;
  setCachedResult(key, result, ttlMs);
}
