import { mapAiDictionaryResultToEntry } from "@/lib/ai/mapAiDictionaryResult";
import {
  parseAiDictionaryResult,
  type AiDictionaryParseErrorCode,
} from "@/lib/ai/aiDictionaryResultSchema";
import { normalizeAiEntryPayload } from "@/lib/dictionary/normalizeAiEntry";
import type { DictionaryEntry, DictionaryQuery } from "@/lib/schemas";
import { dictionaryEntrySchema } from "@/lib/schemas";
import { extractJsonFromAiText } from "./parseAiJson";

export type AiDictionaryEntryParseResult =
  | { success: true; entry: DictionaryEntry }
  | { success: false; code: AiDictionaryParseErrorCode; detail?: string };

function parseJsonPayload(rawContent: string | unknown): unknown {
  if (typeof rawContent !== "string") return rawContent;
  return extractJsonFromAiText(rawContent);
}

/**
 * Parse and validate AI text or object into a DictionaryEntry.
 * Prefers the strict AiDictionaryResult schema, then legacy DictionaryEntry shapes.
 */
export function parseAiDictionaryEntryWithDetails(
  rawContent: string | unknown,
  query: DictionaryQuery,
): AiDictionaryEntryParseResult {
  try {
    const json = parseJsonPayload(rawContent);

    const strict = parseAiDictionaryResult(json);
    if (strict.success) {
      return {
        success: true,
        entry: mapAiDictionaryResultToEntry(strict.data, query),
      };
    }

    const normalized = normalizeAiEntryPayload(json, query);
    const legacy = dictionaryEntrySchema.safeParse(normalized);
    if (legacy.success) {
      return { success: true, entry: legacy.data };
    }

    return {
      success: false,
      code: strict.code,
      detail: strict.detail,
    };
  } catch {
    return { success: false, code: "invalid_json" };
  }
}

/**
 * Parse and validate AI text or object into a DictionaryEntry.
 * Returns null when content is invalid — caller should return unavailable.
 */
export function parseAiDictionaryEntry(
  rawContent: string | unknown,
  query: DictionaryQuery,
): DictionaryEntry | null {
  const result = parseAiDictionaryEntryWithDetails(rawContent, query);
  return result.success ? result.entry : null;
}
