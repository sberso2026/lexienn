import { z } from "zod";
import { validationStatusSchema } from "@/lib/schemas";

export const dialectEditSchema = z.object({
  confidence_level: z.number().min(0).max(1).optional(),
  validation_status: validationStatusSchema.optional(),
  variant_label: z.string().min(1).optional(),
  region: z.string().optional(),
});

export const adminOverridesSchema = z.object({
  customDialects: z.array(z.unknown()).default([]),
  dialectEdits: z.record(z.string(), dialectEditSchema).default({}),
});

export type DialectEdit = z.infer<typeof dialectEditSchema>;
export type AdminOverrides = {
  customDialects: import("@/lib/schemas").Dialect[];
  dialectEdits: Record<string, DialectEdit>;
};

export const EMPTY_ADMIN_OVERRIDES: AdminOverrides = {
  customDialects: [],
  dialectEdits: {},
};
