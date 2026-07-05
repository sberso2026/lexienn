import { z } from "zod";
import {
  offlinePackAudioTypeSchema,
  offlinePackTierSchema,
  phraseCategorySchema,
  validationStatusSchema,
} from "@/lib/schemas/enums";

export const offlinePackStatusSchema = z.enum([
  "missing",
  "downloaded",
  "update_available",
  "generating",
  "text_ready",
  "audio_downloading",
]);

export const offlinePackSourceSchema = z.enum([
  "curated",
  "ai_generated",
  "template",
  "unavailable",
]);

export const offlineVoiceMetadataSchema = z.object({
  language_code: z.string().min(1),
  dialect_id: z.string().optional(),
  audio_type: offlinePackAudioTypeSchema,
  voice_locale: z.string().optional(),
  voice_style: z.string().optional(),
  playback_hint: z.string().optional(),
});

export const offlinePackEntrySchema = z.object({
  id: z.string().min(1),
  pack_id: z.string().min(1),
  category: phraseCategorySchema,
  source_text: z.string().min(1),
  translated_text: z.string().min(1),
  pronunciation_simple: z.string().min(1),
  literal_translation: z.string().optional(),
  usage_note: z.string().optional(),
  confidence_score: z.number().min(0).max(1),
  validation_status: validationStatusSchema,
  source: offlinePackSourceSchema,
  phrase_template_id: z.string().optional(),
  audio_type: offlinePackAudioTypeSchema.default("unavailable"),
  voice_metadata: offlineVoiceMetadataSchema.optional(),
  audio_local_path: z.string().optional(),
  audio_blob_key: z.string().optional(),
  audio_hash: z.string().optional(),
  audio_duration_ms: z.number().int().nonnegative().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const offlineAudioAssetSchema = z.object({
  id: z.string().min(1),
  entry_id: z.string().min(1),
  pack_key: z.string().min(1),
  audio_type: offlinePackAudioTypeSchema,
  voice_locale: z.string().optional(),
  voice_style: z.string().optional(),
  audio_local_path: z.string().optional(),
  audio_blob_key: z.string().min(1),
  audio_hash: z.string().optional(),
  duration_ms: z.number().int().nonnegative().optional(),
  provider: z.string().optional(),
  audio_base64: z.string().optional(),
  audio_mime_type: z.string().optional(),
  created_at: z.string().datetime(),
});

export const offlinePackExampleSchema = z.object({
  id: z.string().min(1),
  entry_id: z.string().min(1),
  source_example: z.string().min(1),
  translated_example: z.string().min(1),
  context_label: z.string().optional(),
});

export const offlineLanguagePairPackSchema = z.object({
  id: z.string().min(1),
  from_language_id: z.string().min(1),
  to_language_id: z.string().min(1),
  to_variant_label: z.string().optional(),
  pack_key: z.string().min(1),
  pack_tier: offlinePackTierSchema.default("lite"),
  schema_version: z.number().int().positive().default(1),
  content_version: z.number().int().positive().default(1),
  generated_by_app_version: z.string().optional(),
  version: z.string().min(1),
  status: offlinePackStatusSchema,
  source: offlinePackSourceSchema,
  phrase_count: z.number().int().nonnegative(),
  audio_count: z.number().int().nonnegative().default(0),
  audio_coverage_percent: z.number().min(0).max(100).default(0),
  text_coverage_percent: z.number().min(0).max(100).default(100),
  estimated_size_bytes: z.number().nonnegative(),
  downloaded_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  from_display_name: z.string().min(1),
  to_display_name: z.string().min(1),
  entry_count: z.number().int().nonnegative(),
});

export const offlineStoredPackSchema = offlineLanguagePairPackSchema.extend({
  entries: z.array(offlinePackEntrySchema),
  examples: z.array(offlinePackExampleSchema).default([]),
});

export const offlinePackGenerateRequestSchema = z.object({
  from_language: z.string().min(1),
  to_language: z.string().min(1),
  pack_tier: offlinePackTierSchema.default("lite"),
  to_dialect: z.string().optional(),
  target_language_selection: z.string().optional(),
  target_locale_tag: z.string().optional(),
  target_dialect_label: z.string().optional(),
  target_display_name: z.string().optional(),
  from_display_name: z.string().optional(),
  user_context: z.enum([
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
  ]).default("traveller"),
  include_audio_manifest: z.boolean().default(true),
});

export const offlinePackValidationSummarySchema = z.object({
  phrase_count: z.number().int().nonnegative(),
  audio_ready_count: z.number().int().nonnegative(),
  audio_coverage_percent: z.number().min(0).max(100),
  text_coverage_percent: z.number().min(0).max(100),
  full_audio_ready: z.boolean(),
  warnings: z.array(z.string()).default([]),
});

export const offlinePackAudioManifestItemSchema = z.object({
  entry_id: z.string().min(1),
  audio_blob_key: z.string().min(1),
  audio_type: offlinePackAudioTypeSchema,
  audio_base64: z.string().optional(),
  audio_mime_type: z.string().optional(),
  voice_locale: z.string().optional(),
  voice_style: z.string().optional(),
});

export const offlinePackGenerateResponseSchema = z.object({
  pack: offlineStoredPackSchema,
  generated_online: z.boolean(),
  validation_summary: offlinePackValidationSummarySchema,
  audio_manifest: z.array(offlinePackAudioManifestItemSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export const offlineRecentPhraseSchema = z.object({
  id: z.string().min(1),
  pack_key: z.string().min(1),
  entry_id: z.string().min(1),
  source_text: z.string().min(1),
  translated_text: z.string().min(1),
  used_at: z.string().datetime(),
});

export const offlineRecentPairSchema = z.object({
  pack_key: z.string().min(1),
  from_language_id: z.string().min(1),
  to_language_id: z.string().min(1),
  from_display_name: z.string().min(1),
  to_display_name: z.string().min(1),
  used_at: z.string().datetime(),
});

export const offlineMissingRequestStatusSchema = z.enum([
  "saved_locally",
  "pending_sync",
  "synced",
]);

export const offlineMissingRequestTypeSchema = z.enum([
  "search",
  "ocr",
  "camera",
]);

export const offlineMissingRequestSchema = z.object({
  id: z.string().min(1),
  from_language_id: z.string().min(1),
  to_language_id: z.string().min(1),
  pack_key: z.string().min(1),
  requested_text: z.string().min(1),
  user_context: z.string().min(1),
  request_type: offlineMissingRequestTypeSchema.default("search"),
  status: offlineMissingRequestStatusSchema,
  created_at: z.string().datetime(),
  synced_at: z.string().datetime().optional(),
  translated_text: z.string().optional(),
  pronunciation_simple: z.string().optional(),
  usage_note: z.string().optional(),
  translation_source: z.string().optional(),
  pack_entry_id: z.string().optional(),
});

export const offlineFavoriteSchema = z.object({
  id: z.string().min(1),
  entry_id: z.string().min(1),
  pack_key: z.string().min(1),
  created_at: z.string().datetime(),
});

export type OfflinePackStatus = z.infer<typeof offlinePackStatusSchema>;
export type OfflinePackSource = z.infer<typeof offlinePackSourceSchema>;
export type OfflinePackEntry = z.infer<typeof offlinePackEntrySchema>;
export type OfflineAudioAsset = z.infer<typeof offlineAudioAssetSchema>;
export type OfflinePackExample = z.infer<typeof offlinePackExampleSchema>;
export type OfflineLanguagePairPack = z.infer<typeof offlineLanguagePairPackSchema>;
export type OfflineStoredPack = z.infer<typeof offlineStoredPackSchema>;
export type OfflinePackGenerateRequest = z.infer<typeof offlinePackGenerateRequestSchema>;
export type OfflinePackGenerateResponse = z.infer<typeof offlinePackGenerateResponseSchema>;
export type OfflinePackValidationSummary = z.infer<typeof offlinePackValidationSummarySchema>;
export type OfflinePackAudioManifestItem = z.infer<typeof offlinePackAudioManifestItemSchema>;
export type OfflineRecentPhrase = z.infer<typeof offlineRecentPhraseSchema>;
export type OfflineRecentPair = z.infer<typeof offlineRecentPairSchema>;
export type OfflineMissingRequestStatus = z.infer<typeof offlineMissingRequestStatusSchema>;
export type OfflineMissingRequestType = z.infer<typeof offlineMissingRequestTypeSchema>;
export type OfflineMissingRequest = z.infer<typeof offlineMissingRequestSchema>;
export type OfflineFavorite = z.infer<typeof offlineFavoriteSchema>;
