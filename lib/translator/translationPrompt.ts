import {
  AUSTRALIAN_ENGLISH_VOCABULARY_RULES,
  INDIGENOUS_AUSTRALIAN_TRANSLATION_RULES,
  isAustralianEnglishTarget,
  isIndigenousAustralianTarget,
} from "@/lib/languages/languageOptions";
import {
  BLAAN_NO_INVENTION_RULES,
  BLAAN_TRANSLATION_RULES,
  buildBlaanVerifiedReferencePromptBlock,
  isBlaanTarget,
} from "@/lib/languages/philippineIndigenousLanguages";
import type { TranslatorRequest } from "./translatorSchemas";

export const TRANSLATION_CAUTION_DISCLAIMER =
  "This is a language translation, not professional medical, legal, financial, or safety advice.";

export const AI_TRANSLATION_GUARDRAIL_MARKERS = {
  jsonOnly: "Return JSON only",
  noMarkdown: "No markdown",
  noInventDialect: "Do not invent dialect words",
  noExactEquivalent: "No exact direct equivalent exists",
  uncertainStatus: "set validation_status to uncertain",
  australianEnglish: "Australian English",
  indigenousAustralian: "Indigenous Australian language",
  noEnglishFallback: "never fall back to English",
  blaan: "B'laan",
  noTagalogFallback: "Do NOT use Tagalog",
  noBisayaFallback: "Do NOT use Cebuano or Bisaya",
  verifiedBlaanOnly: "VERIFIED B'LAAN REFERENCES",
  wordForWord: "word-for-word",
  grammaticallyCorrect: "grammatically correct",
} as const;

function getResponseSchemaBlock(): string {
  return [
    "OUTPUT SCHEMA (TranslationResponse — JSON object):",
    "{",
    '  "original_text": string,',
    '  "translated_text": string (primary translation: faithful meaning + grammatically correct TARGET language),',
    '  "literal_translation": string | null (word-for-word / calque gloss of the source),',
    '  "natural_translation": string (fluent native phrasing of the same meaning),',
    '  "pronunciation_simple": string (sound-out guide for translated_text),',
    '  "usage_note": string | null (register, politeness, dialect notes),',
    '  "confidence_score": number (0.0 to 1.0),',
    `  "validation_status": "ai_generated" | "verified_dictionary" | "community_corrected" | "native_speaker_reviewed" | "professionally_reviewed" | "uncertain",`,
    '  "caution_note": string | null (include for emergency, medical, legal, finance, engineering, or safety-related text)',
    "}",
  ].join("\n");
}

function getModeDefinitionsBlock(): string {
  return [
    "TRANSLATION MODE DEFINITIONS (apply strictly):",
    "- direct: Maximize word-for-word / lexical fidelity. Preserve source word order and mapping where target grammar allows. Put the calque in literal_translation. Set translated_text to the most faithful rendering that is still grammatically correct in the TARGET language (inflect/agree only as required by target grammar). Do not paraphrase for style.",
    "- natural: Prefer fluent native phrasing in translated_text and natural_translation, but keep the FULL meaning. Still fill literal_translation with a word-for-word gloss.",
    "- polite: Same meaning as natural, with higher register / honorifics / politeness particles appropriate to the target.",
    "- simple: Same meaning, shorter common vocabulary, fewer clauses; remain grammatically correct.",
    "- speak_to_local: Short, clear, speakable phrase for live conversation; prioritize intelligibility while keeping meaning complete.",
    "",
    "ALWAYS (all modes):",
    "- Fill BOTH literal_translation (word-for-word gloss) and natural_translation.",
    "- translated_text MUST be grammatically correct in the TARGET language (agreement, word order, particles, tense/aspect as required).",
    "- Never drop source content: numbers, negations, questions, names, and key nouns must remain.",
    "- Prefer attested local forms; if inventing would be required, mark validation_status uncertain instead of guessing slang.",
  ].join("\n");
}

function getTargetDescription(request: TranslatorRequest): string {
  const displayName = request.target_display_name ?? request.target_dialect_label;
  const parts = [displayName ?? request.target_language];
  if (request.target_language && displayName) {
    parts.push(`[code: ${request.target_language}]`);
  }
  if (request.target_dialect && !request.target_dialect_label) {
    parts.push(`(dialect id: ${request.target_dialect})`);
  }
  if (request.target_locale_tag) {
    parts.push(`(${request.target_locale_tag})`);
  }
  return parts.join(" ");
}

export function buildTranslationPrompt(
  request: TranslatorRequest,
  options: { strictIndigenous?: boolean } = {},
): {
  system: string;
  user: string;
} {
  const australianEnglish = isAustralianEnglishTarget(request);
  const indigenousAustralian = isIndigenousAustralianTarget(request);
  const blaanTarget = isBlaanTarget(request);
  const englishToEnglish =
    request.source_language.toLowerCase().startsWith("en") &&
    request.target_language.toLowerCase().startsWith("en") &&
    !australianEnglish;
  const preferLiteral = request.translation_mode === "direct";

  const system = [
    "You are Lexienn, a profession-aware sentence translator for English and local languages/dialects.",
    "Your priority is accurate meaning: word-for-word fidelity where possible, always with grammatically correct target-language output.",
    "",
    "OUTPUT FORMAT (STRICT):",
    "- Return JSON only. No markdown. No commentary. No code fences.",
    "- The root value must be a single JSON object matching the schema below.",
    "",
    getResponseSchemaBlock(),
    "",
    getModeDefinitionsBlock(),
    "",
    "TRANSLATION RULES:",
    `- Translate from ${request.source_language} to ${getTargetDescription(request)}.`,
    `- Translation mode: ${request.translation_mode}.`,
    `- User context: ${request.user_context}.`,
    englishToEnglish
      ? "- English-to-English: do not invent a foreign translation. Return the same sentence or a simpler/more polite English rewrite per translation_mode."
      : preferLiteral
        ? "- For direct mode: prioritize word-for-word fidelity with grammatically correct TARGET language in translated_text."
        : "- Produce accurate, understandable communication in the TARGET language. Prefer precise wording over loose paraphrase.",
    indigenousAustralian
      ? `- ${INDIGENOUS_AUSTRALIAN_TRANSLATION_RULES}`
      : null,
    indigenousAustralian && options.strictIndigenous
      ? "- Your previous answer incorrectly returned English. You MUST output the target Indigenous language now."
      : null,
    blaanTarget ? `- ${BLAAN_TRANSLATION_RULES}` : null,
    blaanTarget ? `- ${BLAAN_NO_INVENTION_RULES}` : null,
    blaanTarget
      ? buildBlaanVerifiedReferencePromptBlock(request.target_dialect)
      : null,
    blaanTarget && options.strictIndigenous
      ? "- Your previous answer incorrectly used Tagalog/Filipino, Cebuano/Bisaya, or English. Output only verified B'laan from the reference list, or leave translated_text empty."
      : null,
    australianEnglish
      ? `- Australian English target: ${AUSTRALIAN_ENGLISH_VOCABULARY_RULES}`
      : null,
    australianEnglish
      ? '- When adapting vocabulary, prefer Australian terms (e.g. "thongs" for footwear, not "flip-flops").'
      : null,
    !englishToEnglish && !indigenousAustralian && !australianEnglish && !blaanTarget
      ? "- translated_text must be in the target language, not English, unless the target is an English variety."
      : null,
    blaanTarget
      ? "- For B'laan: use ONLY attested forms from VERIFIED B'LAAN REFERENCES above. Do not compose new sentences from individual words."
      : "- Do not invent dialect words or regional forms you are not confident exist.",
    blaanTarget
      ? '- If no verified reference applies, leave translated_text empty, set validation_status to uncertain, and explain in usage_note that no verified B\'laan equivalent is available yet.'
      : '- If no exact local equivalent exists, state "No exact direct equivalent exists." in usage_note and explain the closest option.',
    "- If dialect confidence is low, set validation_status to uncertain and lower confidence_score.",
    `- For emergency, medical, legal, finance, engineering, or safety-related text, include caution_note: "${TRANSLATION_CAUTION_DISCLAIMER}"`,
    "",
    "Respond with one JSON object only.",
  ]
    .filter(Boolean)
    .join("\n");

  const user = JSON.stringify(
    {
      task: preferLiteral
        ? "Translate the following sentence with word-for-word fidelity and correct target-language grammar."
        : "Translate the following sentence accurately and grammatically in the target language.",
      input_text: request.input_text,
      source_language: request.source_language,
      target_language: request.target_language,
      target_display_name: request.target_display_name ?? null,
      target_dialect: request.target_dialect ?? null,
      target_language_selection: request.target_language_selection ?? null,
      target_locale_tag: request.target_locale_tag ?? null,
      target_dialect_label: request.target_dialect_label ?? null,
      user_context: request.user_context,
      translation_mode: request.translation_mode,
    },
    null,
    2,
  );

  return { system, user };
}
