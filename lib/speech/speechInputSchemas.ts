import { z } from "zod";
import { userContextSchema } from "@/lib/schemas";

export const speechInputTargetSchema = z.enum(["dictionary", "translator"]);

export const speechInputSourceSchema = z.enum([
  "browser_speech",
  "cloud_speech",
  "unavailable",
]);

export const speechTranscribeRequestSchema = z.object({
  language_hint: z.string().min(1).default("en"),
  user_context: userContextSchema.default("general"),
  input_target: speechInputTargetSchema,
});

export const speechTranscribeResponseSchema = z.object({
  transcript: z.string(),
  detected_language: z.string().optional(),
  confidence_score: z.number().min(0).max(1),
  source: speechInputSourceSchema,
  warnings: z.array(z.string()).default([]),
  unavailable_reason: z.string().optional(),
});

export const speechTranscribeErrorSchema = z.object({
  error: z.string(),
  details: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

export type SpeechInputTarget = z.infer<typeof speechInputTargetSchema>;
export type SpeechInputSource = z.infer<typeof speechInputSourceSchema>;
export type SpeechTranscribeResponse = z.infer<typeof speechTranscribeResponseSchema>;

export type VoiceInputState =
  | "idle"
  | "listening"
  | "processing"
  | "ready"
  | "error"
  | "permission_denied"
  | "unsupported";

export const VOICE_INPUT_PRIVACY_NOTE =
  "Voice is used only to create the transcript and is not saved by default.";
