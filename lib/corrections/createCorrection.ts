import type { CorrectionSubmission } from "@/lib/schemas";
import { correctionSubmissionSchema } from "@/lib/schemas";

export type CorrectionFormInput = {
  original_text: string;
  current_translation: string;
  suggested_correction: string;
  language: string;
  dialect?: string;
  correction_type: CorrectionSubmission["correction_type"];
  contributor_note?: string;
  is_native_speaker: boolean;
  is_profession_reviewer: boolean;
  source_language?: string;
  source_type?: string;
  user_context?: string;
};

export function createCorrectionSubmission(
  input: CorrectionFormInput,
): CorrectionSubmission {
  return correctionSubmissionSchema.parse({
    id: `correction-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    original_text: input.original_text.trim(),
    current_translation: input.current_translation.trim(),
    suggested_correction: input.suggested_correction.trim(),
    language: input.language,
    dialect: input.dialect,
    correction_type: input.correction_type,
    contributor_note: input.contributor_note?.trim() || undefined,
    is_native_speaker: input.is_native_speaker,
    is_profession_reviewer: input.is_profession_reviewer,
    status: "pending_sync",
    created_at: new Date().toISOString(),
    source_language: input.source_language,
    source_type: input.source_type,
    user_context: input.user_context,
  });
}
