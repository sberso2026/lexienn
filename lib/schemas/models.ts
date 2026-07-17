import { z } from "zod";
import {
  audioTypeSchema,
  correctionStatusSchema,
  correctionTypeSchema,
  entryTypeSchema,
  explanationLevelSchema,
  offlineResolutionMethodSchema,
  outputModeSchema,
  phraseCategorySchema,
  userContextSchema,
  validationStatusSchema,
} from "./enums";

export const confidenceStatusSchema = z.object({
  score: z.number().min(0).max(1),
  level: z.enum(["high", "medium", "low"]),
  warning: z.string().optional(),
});

export const languageSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(2).max(10),
  name: z.string().min(1),
  native_name: z.string().min(1),
  is_active: z.boolean().default(true),
  is_mock_data: z.boolean().default(true),
});

export const dialectSchema = z.object({
  id: z.string().min(1),
  language_id: z.string().min(1),
  name: z.string().min(1),
  variant_label: z.string().min(1),
  region: z.string().optional(),
  confidence_level: z.number().min(0).max(1),
  validation_status: validationStatusSchema,
  is_mock_data: z.boolean().default(true),
});

export const userContextProfileSchema = z.object({
  context: userContextSchema,
  label: z.string().min(1),
  description: z.string().optional(),
  explanation_level_default: explanationLevelSchema.default("normal"),
});

export const dictionaryQuerySchema = z.object({
  input_text: z.string().min(1, "Input text is required"),
  source_language: z.string().min(1),
  target_language: z.string().min(1, "Target language is required"),
  target_dialect: z.string().optional(),
  target_language_selection: z.string().optional(),
  target_locale_tag: z.string().optional(),
  target_dialect_label: z.string().optional(),
  target_display_name: z.string().optional(),
  user_context: userContextSchema.default("general"),
  explanation_level: explanationLevelSchema.default("normal"),
  output_mode: outputModeSchema.default("explain_and_translate"),
});

export const professionMeaningSchema = z.object({
  context: userContextSchema,
  meaning_en: z.string().min(1),
  caution_note: z.string().optional(),
});

export const pronunciationInfoSchema = z.object({
  simple: z.string().min(1),
  syllables: z.string().optional(),
  ipa: z.string().optional(),
});

export const exampleSentenceSchema = z.object({
  text: z.string().min(1),
  language_code: z.string().min(1),
  context_label: z.string().optional(),
});

export const dictionaryEntrySchema = z.object({
  id: z.string().min(1),
  input_text: z.string().min(1),
  source_language: z.string().min(1),
  target_language: z.string().min(1),
  target_dialect: z.string().optional(),
  entry_type: entryTypeSchema,
  general_meaning_en: z.string().min(1),
  detailed_meaning_en: z.string().min(1),
  target_meaning: z.string().min(1),
  closest_local_equivalent_note: z.string().optional(),
  profession_meanings: z.array(professionMeaningSchema).default([]),
  examples: z.array(exampleSentenceSchema).default([]),
  pronunciation: pronunciationInfoSchema,
  usage_notes: z.array(z.string()).default([]),
  related_terms: z.array(z.string()).default([]),
  common_mistakes: z.array(z.string()).default([]),
  confidence: confidenceStatusSchema,
  validation_status: validationStatusSchema,
  audio_type: audioTypeSchema,
  is_mock_data: z.boolean().default(true),
  mock_data_notice: z.string().optional(),
});

export const offlinePhraseSchema = z.object({
  id: z.string().min(1),
  english: z.string().min(1),
  target_text: z.string().min(1),
  dialect_id: z.string().min(1),
  pronunciation_simple: z.string().min(1),
  category: phraseCategorySchema,
  audio_type: audioTypeSchema,
  validation_status: validationStatusSchema,
  confidence: confidenceStatusSchema,
  local_responses: z.array(z.string()).optional(),
  is_mock_data: z.boolean().default(true),
});

export const offlinePhrasePackSchema = z.object({
  id: z.string().min(1),
  language_id: z.string().min(1),
  dialect_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categories: z.array(phraseCategorySchema).default([]),
  phrases: z.array(offlinePhraseSchema).default([]),
  phrase_count: z.number().int().nonnegative(),
  estimated_size_kb: z.number().nonnegative(),
  is_mock_data: z.boolean().default(true),
});

export const offlineTranslationResultSchema = z.object({
  original_sentence: z.string().min(1),
  resolved_translation: z.string().min(1),
  resolution_method: offlineResolutionMethodSchema,
  confidence_score: z.number().min(0).max(1),
  warning: z.string().optional(),
  matched_phrase_id: z.string().optional(),
  pronunciation_simple: z.string().optional(),
  debug_note: z.string().optional(),
});

export const savedWordSchema = z.object({
  id: z.string().min(1),
  input_text: z.string().min(1),
  entry_type: entryTypeSchema,
  target_language: z.string().min(1),
  target_dialect: z.string().optional(),
  user_context: userContextSchema,
  short_meaning: z.string().min(1),
  target_meaning: z.string().min(1),
  pronunciation_simple: z.string().min(1),
  saved_at: z.string().datetime(),
  validation_status: validationStatusSchema,
  confidence_score: z.number().min(0).max(1),
});

export const correctionSubmissionSchema = z.object({
  id: z.string().min(1),
  original_text: z.string().min(1),
  current_translation: z.string().min(1),
  suggested_correction: z.string().min(1),
  language: z.string().min(1),
  dialect: z.string().optional(),
  correction_type: correctionTypeSchema,
  contributor_note: z.string().optional(),
  is_native_speaker: z.boolean().default(false),
  is_profession_reviewer: z.boolean().default(false),
  status: correctionStatusSchema.default("pending_sync"),
  created_at: z.string().datetime(),
  source_language: z.string().optional(),
  source_type: z.string().optional(),
  user_context: z.string().optional(),
});

export type ConfidenceStatus = z.infer<typeof confidenceStatusSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Dialect = z.infer<typeof dialectSchema>;
export type UserContextProfile = z.infer<typeof userContextProfileSchema>;
export type DictionaryQuery = z.infer<typeof dictionaryQuerySchema>;
export type DictionaryEntry = z.infer<typeof dictionaryEntrySchema>;
export type ProfessionMeaning = z.infer<typeof professionMeaningSchema>;
export type PronunciationInfo = z.infer<typeof pronunciationInfoSchema>;
export type ExampleSentence = z.infer<typeof exampleSentenceSchema>;
export type OfflinePhrase = z.infer<typeof offlinePhraseSchema>;
export type OfflinePhrasePack = z.infer<typeof offlinePhrasePackSchema>;
export type OfflineTranslationResult = z.infer<typeof offlineTranslationResultSchema>;
export type SavedWord = z.infer<typeof savedWordSchema>;
export type CorrectionSubmission = z.infer<typeof correctionSubmissionSchema>;
