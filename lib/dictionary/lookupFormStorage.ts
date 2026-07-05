import { DICTIONARY_LOOKUP_FORM_STORAGE_KEY } from "./constants";
import type { DictionaryQuery } from "@/lib/schemas";
import {
  explanationLevelSchema,
  outputModeSchema,
  userContextSchema,
} from "@/lib/schemas";
import { z } from "zod";

export const dictionaryLookupFormSchema = z.object({
  input_text: z.string(),
  source_language: z.string().min(1),
  target_language: z.string().min(1),
  target_dialect: z.string(),
  user_context: userContextSchema,
  explanation_level: explanationLevelSchema,
  output_mode: outputModeSchema,
});

export type StoredDictionaryLookupForm = z.infer<typeof dictionaryLookupFormSchema>;

export function saveDictionaryLookupForm(form: StoredDictionaryLookupForm): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DICTIONARY_LOOKUP_FORM_STORAGE_KEY, JSON.stringify(form));
}

export function saveDictionaryLookupFormFromQuery(query: DictionaryQuery): void {
  saveDictionaryLookupForm({
    input_text: query.input_text,
    source_language: query.source_language,
    target_language: query.target_language,
    target_dialect: query.target_dialect ?? "",
    user_context: query.user_context,
    explanation_level: query.explanation_level,
    output_mode: query.output_mode,
  });
}

export function loadDictionaryLookupForm(): StoredDictionaryLookupForm | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(DICTIONARY_LOOKUP_FORM_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = dictionaryLookupFormSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
