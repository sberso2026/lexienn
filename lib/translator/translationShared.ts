import { TRANSLATION_CAUTION_DISCLAIMER } from "@/lib/translator/translationPrompt";
import type { TranslatorRequest } from "@/lib/translator/translatorSchemas";

const REGULATED_CONTEXTS = new Set([
  "health_emergency",
  "engineer",
  "construction_worker",
]);

const REGULATED_KEYWORDS =
  /\b(doctor|hospital|clinic|emergency|medic|legal|lawyer|money|bank|engineer|bridge|flood|safe|danger)\b/i;

export function buildCautionNote(request: TranslatorRequest): string | undefined {
  if (
    REGULATED_CONTEXTS.has(request.user_context) ||
    REGULATED_KEYWORDS.test(request.input_text)
  ) {
    return TRANSLATION_CAUTION_DISCLAIMER;
  }
  return undefined;
}

export function isEnglishLanguage(code: string): boolean {
  return code.toLowerCase().startsWith("en");
}
