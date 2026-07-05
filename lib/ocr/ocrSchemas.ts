import { z } from "zod";
import { userContextSchema } from "@/lib/schemas";

export const ocrSourceSchema = z.enum(["local_ocr", "cloud_ocr", "unavailable"]);

export const ocrBlockSchema = z.object({
  text: z.string().min(1),
  confidence_score: z.number().min(0).max(1).optional(),
  bounding_box_json: z.string().optional(),
  reading_order: z.number().int().nonnegative().optional(),
});

export const ocrExtractRequestSchema = z.object({
  image_base64: z.string().min(1),
  image_mime_type: z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
  source_language_hint: z.string().min(1).default("auto"),
  target_language: z.string().min(1),
  target_variant_label: z.string().optional(),
  user_context: userContextSchema.default("general"),
});

export const ocrExtractResponseSchema = z.object({
  extracted_text: z.string(),
  detected_language: z.string().optional(),
  confidence_score: z.number().min(0).max(1),
  blocks: z.array(ocrBlockSchema).optional(),
  warnings: z.array(z.string()).default([]),
  source: ocrSourceSchema,
  unavailable_reason: z.string().optional(),
});

export const ocrErrorSchema = z.object({
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

export type OcrSource = z.infer<typeof ocrSourceSchema>;
export type OcrBlock = z.infer<typeof ocrBlockSchema>;
export type OcrExtractRequest = z.infer<typeof ocrExtractRequestSchema>;
export type OcrExtractResponse = z.infer<typeof ocrExtractResponseSchema>;
