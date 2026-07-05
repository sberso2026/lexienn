import { z } from "zod";

export const entryTypeSchema = z.enum([
  "word",
  "phrase",
  "idiom",
  "slang",
  "proverb",
  "technical_term",
  "sentence",
]);

export const userContextSchema = z.enum([
  "general",
  "student",
  "household_family",
  "engineer",
  "construction_worker",
  "business_owner",
  "farmer",
  "traveller",
  "health_emergency",
  "custom",
]);

export const validationStatusSchema = z.enum([
  "ai_generated",
  "ai_generated_unverified",
  "verified_dictionary",
  "curated",
  "community_corrected",
  "native_speaker_reviewed",
  "professionally_reviewed",
  "uncertain",
]);

export const audioTypeSchema = z.enum([
  "native_recorded",
  "synthetic_tts",
  "cached_cloud_tts",
  "unavailable",
]);

export const dictionaryResolutionSourceSchema = z.enum([
  "curated_dictionary",
  "domain_glossary",
  "external_dictionary",
  "ai_generated",
  "unavailable",
]);

export const explanationLevelSchema = z.enum([
  "simple",
  "normal",
  "advanced",
  "professional",
]);

export const outputModeSchema = z.enum([
  "explain",
  "translate",
  "explain_and_translate",
  "speak_to_local",
]);

export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const correctionTypeSchema = z.enum([
  "meaning",
  "translation",
  "pronunciation",
  "sample_sentence",
  "cultural_note",
  "audio",
]);

export const correctionStatusSchema = z.enum([
  "pending_sync",
  "ready_for_review",
  "simulated_synced",
]);

export const phraseCategorySchema = z.enum([
  "emergency",
  "directions",
  "food_and_water",
  "transport",
  "medical",
  "price_and_money",
  "accommodation",
  "respectful_greetings",
  "fieldwork_engineering",
  "household_family",
  "time_and_schedule",
  "shopping_and_market",
  "safety_and_danger",
  "police_and_authority",
  "phone_and_communication",
  "farming_and_rural",
  "weather_and_environment",
  "problems_and_repairs",
  "consent_and_permission",
  "local_response_board",
]);

export const offlinePackAudioTypeSchema = z.enum([
  "native_recorded",
  "ai_generated",
  "device_tts_fallback",
  "unavailable",
]);

export const offlinePackTierSchema = z.enum(["lite", "standard", "professional"]);

export const offlineResolutionMethodSchema = z.enum([
  "exact_phrase",
  "template",
  "keyword_fallback",
  "simplified_suggestion",
  "unavailable",
]);

export type EntryType = z.infer<typeof entryTypeSchema>;
export type UserContext = z.infer<typeof userContextSchema>;
export type ValidationStatus = z.infer<typeof validationStatusSchema>;
export type AudioType = z.infer<typeof audioTypeSchema>;
export type ExplanationLevel = z.infer<typeof explanationLevelSchema>;
export type OutputMode = z.infer<typeof outputModeSchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type CorrectionType = z.infer<typeof correctionTypeSchema>;
export type CorrectionStatus = z.infer<typeof correctionStatusSchema>;
export type PhraseCategory = z.infer<typeof phraseCategorySchema>;
export type OfflinePackAudioType = z.infer<typeof offlinePackAudioTypeSchema>;
export type OfflinePackTier = z.infer<typeof offlinePackTierSchema>;
export type OfflineResolutionMethod = z.infer<typeof offlineResolutionMethodSchema>;
export type DictionaryResolutionSource = z.infer<
  typeof dictionaryResolutionSourceSchema
>;
