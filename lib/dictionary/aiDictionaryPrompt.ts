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
import type { DictionaryQuery } from "@/lib/schemas";

/** Shown in profession_meanings.caution_note or usage_notes for regulated domains. */
export const PROFESSIONAL_ADVICE_DISCLAIMER =
  "This is a language explanation, not professional design advice.";

/**
 * Key phrases tests assert are present in the system prompt.
 * Keeps guardrails auditable without parsing free-form prose.
 */
export const AI_DICTIONARY_GUARDRAIL_MARKERS = {
  jsonOnly: "Return JSON only",
  noMarkdown: "No markdown",
  noCommentary: "No commentary",
  noInventDialect: "Do not invent dialect words",
  noExactEquivalent: "no exact direct equivalent",
  uncertainStatus: "lower confidenceScore",
  lowConfidenceUncertain: "If dialect confidence is low, lower confidenceScore",
  professionalDisclaimer: PROFESSIONAL_ADVICE_DISCLAIMER,
} as const;

const PROFESSIONAL_DOMAINS = [
  "engineering",
  "medical",
  "legal",
  "finance",
  "safety",
] as const;

function getAiDictionaryResultSchemaBlock(): string {
  return [
    "OUTPUT SCHEMA (AiDictionaryResult — return exactly these camelCase keys):",
    "{",
    '  "word": string,',
    '  "sourceLanguage": string (ISO-style code),',
    '  "targetLanguage": string (ISO-style code),',
    '  "partOfSpeech": string (e.g. noun, verb, phrase, idiom, technical_term),',
    '  "generalMeaning": string (concise English meaning),',
    '  "detailedMeaning": string (expanded English explanation),',
    '  "definitionSummary": string (target-language meaning OR English definition summary for English-to-English),',
    '  "sampleSentences": string[] | { "text": string, "languageCode"?: string, "contextLabel"?: string }[],',
    '  "pronunciationText": string (sound-out guide),',
    '  "usageNotes": string[],',
    '  "relatedTerms": string[],',
    '  "commonMistakes": string[],',
    '  "confidenceScore": number (0.0 to 1.0; default moderate ~0.65 unless strong evidence),',
    '  "confidenceLabel": "high" | "medium" | "low",',
    '  "validationStatus": "ai_generated_unverified"',
    "}",
  ].join("\n");
}

function getContentRulesBlock(query: DictionaryQuery): string {
  const australianEnglish = isAustralianEnglishTarget(query);
  const englishToEnglish =
    query.source_language.toLowerCase().startsWith("en") &&
    query.target_language.toLowerCase().startsWith("en") &&
    !australianEnglish;

  const rules = [
    "CONTENT RULES:",
    "1. Provide generalMeaning (concise) and detailedMeaning (expanded) in English.",
  ];

  if (englishToEnglish) {
    rules.push(
      "2. English-to-English request: treat as a dictionary definition. Set definitionSummary to detailedMeaning or an equivalent English explanation. Do not invent translation text.",
    );
  } else if (australianEnglish) {
    rules.push(
      `2. Australian English target: put the meaning in Australian English in definitionSummary. ${AUSTRALIAN_ENGLISH_VOCABULARY_RULES}`,
      '3. Prefer Australian terms (e.g. "thongs" for footwear, not "flip-flops").',
      `4. User context is "${query.user_context}" — reflect it in usageNotes or sampleSentences when relevant.`,
      "5. sampleSentences: include at least one English example and at least one Australian English example.",
      "6. pronunciationText is required.",
      "7. confidenceScore: use moderate values (~0.6–0.75) unless you have strong evidence.",
      '8. validationStatus must always be "ai_generated_unverified".',
      "9. Do not claim verified dictionary or native-speaker validation.",
    );
  } else if (isBlaanTarget(query)) {
    rules.push(
      `2. B'laan target (${query.target_display_name ?? query.target_language}): put the meaning in B'laan in definitionSummary for the selected South Cotabato/Sarangani variety. ${BLAAN_TRANSLATION_RULES}`,
      `3. ${BLAAN_NO_INVENTION_RULES}`,
      buildBlaanVerifiedReferencePromptBlock(query.target_dialect),
      "4. Do not return Tagalog, Filipino, Cebuano, Bisaya, or English-only definitionSummary for B'laan targets.",
      "5. Use only attested B'laan from VERIFIED B'LAAN REFERENCES. If none apply, say so in definitionSummary.",
      `6. User context is "${query.user_context}" — reflect it in usageNotes or sampleSentences when relevant.`,
      "7. sampleSentences: include at least one English example; add B'laan only when a verified reference exists.",
      "8. pronunciationText is required.",
      "9. confidenceScore: use moderate values (~0.6–0.75) unless you have strong evidence.",
      '10. validationStatus must always be "ai_generated_unverified".',
      "11. Do not claim verified dictionary or native-speaker validation.",
    );
  } else if (isIndigenousAustralianTarget(query)) {
    rules.push(
      `2. Indigenous Australian target (${query.target_display_name ?? query.target_language}): put the meaning in that language in definitionSummary (romanized where needed). ${INDIGENOUS_AUSTRALIAN_TRANSLATION_RULES}`,
      "3. Do not return English-only definitionSummary for Indigenous Australian targets.",
      `4. User context is "${query.user_context}" — reflect it in usageNotes or sampleSentences when relevant.`,
      "5. sampleSentences: include at least one English example and at least one target-language example.",
      "6. pronunciationText is required.",
      "7. confidenceScore: use moderate values (~0.6–0.75) unless you have strong evidence.",
      '8. validationStatus must always be "ai_generated_unverified".',
      "9. Do not claim verified dictionary or native-speaker validation.",
    );
  } else {
    rules.push(
      `2. Target language: put the meaning in ${query.target_language} in definitionSummary. If no exact direct equivalent exists, say so clearly in definitionSummary.`,
      `3. User context is "${query.user_context}" — reflect it in usageNotes or sampleSentences when relevant.`,
      "4. sampleSentences: include at least one English example; add target-language example when not English-to-English.",
      "5. pronunciationText is required.",
      "6. confidenceScore: use moderate values (~0.6–0.75) unless you have strong evidence.",
      '7. validationStatus must always be "ai_generated_unverified".',
      "8. Do not claim verified dictionary or native-speaker validation.",
    );
  }

  if (englishToEnglish) {
    rules.push(
      `3. User context is "${query.user_context}" — reflect it in usageNotes or sampleSentences when relevant.`,
      "4. sampleSentences: include at least one English example.",
      "5. pronunciationText is required.",
      "6. confidenceScore: use moderate values (~0.6–0.75) unless you have strong evidence.",
      '7. validationStatus must always be "ai_generated_unverified".',
      "8. Do not claim verified dictionary or native-speaker validation.",
    );
  }

  return rules.join("\n");
}

function getUncertaintyRulesBlock(): string {
  return [
    "UNCERTAINTY AND HONESTY RULES:",
    `- If there is no exact direct equivalent in the target language/dialect, state that clearly in closest_local_equivalent_note and target_meaning. Use phrasing such as "No exact direct equivalent exists" and describe the closest local option.`,
    "- Do not invent dialect words, slang, idioms, or regional forms you are not confident exist.",
    "- Do not claim native-speaker verification, community validation, or dictionary verification unless explicitly provided in the request (never for unverified AI output).",
    "- If dialect confidence is low, lower confidenceScore and note uncertainty in usageNotes.",
    "- When uncertain about spelling, sense, or regional usage, keep confidenceScore moderate or low.",
    "- Separate verified facts from AI-generated interpretation in usage_notes when helpful.",
  ].join("\n");
}

function getNoInventionRulesBlock(): string {
  return [
    "DIALECT AND TRANSLATION INTEGRITY:",
    "- Do not invent dialect words or phrases.",
    "- Prefer well-attested vocabulary; if unsure, use closest_local_equivalent_note to explain the gap.",
    "- Do not fabricate IPA, regional labels, or example sentences in the target dialect.",
    "- If output_mode is translate or explain_and_translate, still follow the no-invention rules for target_meaning.",
  ].join("\n");
}

function getProfessionalSafetyBlock(): string {
  return [
    "PROFESSIONAL AND SAFETY CONTEXTS:",
    `For ${PROFESSIONAL_DOMAINS.join(", ")}-related terms, include in profession_meanings.caution_note or usage_notes:`,
    `"${PROFESSIONAL_ADVICE_DISCLAIMER}"`,
    "- Do not provide design, medical, legal, financial, or safety instructions — only language meaning.",
  ].join("\n");
}

function getOutputFormatBlock(): string {
  return [
    "OUTPUT FORMAT (STRICT):",
    "- Return JSON only. No markdown. No commentary. No code fences. No trailing text.",
    "- The root value must be a single JSON object matching AiDictionaryResult.",
    "- Do not wrap the JSON in an outer envelope (no { \"entry\": ... } unless entry is the root).",
    "- All string fields must be plain text, not markdown.",
  ].join("\n");
}

/**
 * Builds the system and user messages for AI dictionary generation.
 * Guardrails are designed to match the Lexienn DictionaryEntry Zod schema.
 */
export function buildAiDictionaryPrompt(
  query: DictionaryQuery,
  options: { isRetry?: boolean } = {},
): {
  system: string;
  user: string;
} {
  const system = [
    "You are Lexienn, a profession-aware dictionary assistant for English and local languages/dialects.",
    "",
    getOutputFormatBlock(),
    "",
    getAiDictionaryResultSchemaBlock(),
    "",
    getContentRulesBlock(query),
    "",
    getUncertaintyRulesBlock(),
    "",
    getNoInventionRulesBlock(),
    "",
    getProfessionalSafetyBlock(),
    "",
    `Explanation level for this request: ${query.explanation_level}.`,
    `Output mode: ${query.output_mode}.`,
    "Respond with one JSON object only.",
  ].join("\n");

  const user = JSON.stringify(
    {
      task: "Generate an AiDictionaryResult for the following lookup.",
      word: query.input_text,
      sourceLanguage: query.source_language,
      targetLanguage: query.target_language,
      target_display_name: query.target_display_name ?? null,
      target_dialect: query.target_dialect ?? null,
      target_language_selection: query.target_language_selection ?? null,
      target_locale_tag: query.target_locale_tag ?? null,
      target_dialect_label: query.target_dialect_label ?? null,
      user_context: query.user_context,
      explanation_level: query.explanation_level,
      output_mode: query.output_mode,
      reminders: [
        "Return JSON only with camelCase keys.",
        "Do not invent dialect words.",
        "State clearly when there is no exact direct equivalent.",
        'validationStatus must be "ai_generated_unverified".',
        PROFESSIONAL_ADVICE_DISCLAIMER,
        ...(options.isRetry
          ? [
              "Your previous response was invalid JSON or missing required fields. Return one valid JSON object only.",
            ]
          : []),
      ],
    },
    null,
    2,
  );

  return { system, user };
}

/** Returns true when all required guardrail markers appear in the system prompt. */
export function promptIncludesRequiredGuardrails(systemPrompt: string): boolean {
  return Object.values(AI_DICTIONARY_GUARDRAIL_MARKERS).every((marker) =>
    systemPrompt.includes(marker),
  );
}
