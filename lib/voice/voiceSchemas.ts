import { z } from "zod";

export const voiceSpeedSchema = z.enum(["normal", "slow"]);
export const voiceModeSchema = z.enum(["ai", "native_recorded", "browser_fallback"]);

export const voiceSpeakRequestSchema = z.object({
  text: z.string().min(1).max(4096),
  language: z.string().min(1),
  dialect: z.string().optional(),
  dialect_label: z.string().optional(),
  region: z.string().optional(),
  locale_tag: z.string().optional(),
  voice_instruction: z.string().optional(),
  speed: voiceSpeedSchema.default("normal"),
  voice_mode: voiceModeSchema.default("ai"),
  audio_url: z.string().url().optional(),
  pronunciation_simple: z.string().optional(),
});

export const voiceAudioTypeSchema = z.enum([
  "ai_generated",
  "native_recorded",
  "browser_fallback",
  "unavailable",
]);

export const voiceSpeakResponseSchema = z.object({
  audio_url: z.string().url().optional(),
  audio_base64: z.string().optional(),
  audio_mime_type: z.string().optional(),
  audio_type: voiceAudioTypeSchema,
  provider: z.string(),
  warning_message: z.string().optional(),
});

export const voiceStatusResponseSchema = z.object({
  voice_enabled: z.boolean(),
  provider: z.string(),
  provider_configured: z.boolean(),
  model_configured: z.boolean(),
  fallback_enabled: z.boolean(),
});

export type VoiceSpeed = z.infer<typeof voiceSpeedSchema>;
export type VoiceMode = z.infer<typeof voiceModeSchema>;
export type VoiceSpeakRequest = z.infer<typeof voiceSpeakRequestSchema>;
export type VoiceAudioType = z.infer<typeof voiceAudioTypeSchema>;
export type VoiceSpeakResponse = z.infer<typeof voiceSpeakResponseSchema>;
export type VoiceStatusResponse = z.infer<typeof voiceStatusResponseSchema>;
