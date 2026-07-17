"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { getCatalogDialectById } from "@/lib/admin/catalog";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";
import { createCorrectionSubmission } from "@/lib/corrections/createCorrection";
import { getLanguageSelectGroups } from "@/lib/mock";
import { correctionTypeSchema } from "@/lib/schemas";
import { saveCorrection } from "@/lib/storage/correctionsStorage";

const correctionFormSchema = z.object({
  original_text: z.string().min(1, "Original text is required"),
  current_translation: z.string().min(1, "Current translation is required"),
  suggested_correction: z.string().min(1, "Suggested correction is required"),
  language: z.string().min(1, "Language is required"),
  dialect: z.string().optional(),
  correction_type: correctionTypeSchema,
  contributor_note: z.string().optional(),
  is_native_speaker: z.boolean(),
  is_profession_reviewer: z.boolean(),
});

export type CorrectionFormDefaults = {
  original_text: string;
  current_translation: string;
  language: string;
  dialect?: string;
  correction_type?: z.infer<typeof correctionTypeSchema>;
  source_language?: string;
  source_type?: string;
  user_context?: string;
};

interface CorrectionFormProps {
  defaults: CorrectionFormDefaults;
  onClose: () => void;
  onSubmitted?: () => void;
  title?: string;
}

function fieldClassName(hasError: boolean) {
  return `mt-1 w-full min-h-11 rounded-lg border bg-[var(--card)] px-3 py-2 text-base ${
    hasError ? "border-red-500" : "border-[var(--card-border)]"
  }`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
      {message}
    </p>
  );
}

export function CorrectionForm({
  defaults,
  onClose,
  onSubmitted,
  title = "Submit correction",
}: CorrectionFormProps) {
  const [form, setForm] = useState({
    original_text: defaults.original_text,
    current_translation: defaults.current_translation,
    suggested_correction: "",
    language: defaults.language,
    dialect: defaults.dialect ?? "",
    correction_type: defaults.correction_type ?? ("translation" as const),
    contributor_note: "",
    is_native_speaker: false,
    is_profession_reviewer: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      ...form,
      dialect: form.dialect || undefined,
      contributor_note: form.contributor_note || undefined,
    };

    const result = correctionFormSchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !errors[path]) {
          errors[path] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    const correction = createCorrectionSubmission({
      ...result.data,
      source_language: defaults.source_language,
      source_type: defaults.source_type,
      user_context: defaults.user_context,
    });
    setIsSaving(true);
    saveCorrection(correction);
    setMessage("Correction saved locally with pending sync status.");
    setIsSaving(false);
    onSubmitted?.();
  }

  return (
    <FeatureCard title={title} className="mt-4 border-2 border-[var(--accent)]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="correction-original" className="block text-sm font-medium">
            Original word or phrase
          </label>
          <input
            id="correction-original"
            value={form.original_text}
            onChange={(e) => updateField("original_text", e.target.value)}
            className={fieldClassName(Boolean(fieldErrors.original_text))}
            aria-invalid={Boolean(fieldErrors.original_text)}
            aria-describedby={
              fieldErrors.original_text ? "correction-original-error" : undefined
            }
          />
          <FieldError id="correction-original-error" message={fieldErrors.original_text} />
        </div>

        <div>
          <label htmlFor="correction-current" className="block text-sm font-medium">
            Current translation
          </label>
          <textarea
            id="correction-current"
            rows={2}
            value={form.current_translation}
            onChange={(e) => updateField("current_translation", e.target.value)}
            className={fieldClassName(Boolean(fieldErrors.current_translation))}
          />
          {fieldErrors.current_translation && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.current_translation}</p>
          )}
        </div>

        <div>
          <label htmlFor="correction-suggested" className="block text-sm font-medium">
            Suggested correction <span className="text-red-600">*</span>
          </label>
          <textarea
            id="correction-suggested"
            rows={2}
            value={form.suggested_correction}
            onChange={(e) => updateField("suggested_correction", e.target.value)}
            className={fieldClassName(Boolean(fieldErrors.suggested_correction))}
            aria-invalid={Boolean(fieldErrors.suggested_correction)}
            aria-describedby={
              fieldErrors.suggested_correction
                ? "correction-suggested-error"
                : undefined
            }
          />
          <FieldError
            id="correction-suggested-error"
            message={fieldErrors.suggested_correction}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="correction-language" className="block text-sm font-medium">
              Language
            </label>
            <select
              id="correction-language"
              value={form.language}
              onChange={(e) => updateField("language", e.target.value)}
              className={fieldClassName(false)}
            >
              {getLanguageSelectGroups().map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="correction-dialect" className="block text-sm font-medium">
              Dialect
            </label>
            <input
              id="correction-dialect"
              value={form.dialect}
              onChange={(e) => updateField("dialect", e.target.value)}
              placeholder="Dialect ID or label (optional)"
              className={fieldClassName(false)}
            />
            {form.dialect && getCatalogDialectById(form.dialect) && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {getCatalogDialectById(form.dialect)?.variant_label}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="correction-type" className="block text-sm font-medium">
            Correction type
          </label>
          <select
            id="correction-type"
            value={form.correction_type}
            onChange={(e) =>
              updateField(
                "correction_type",
                e.target.value as (typeof form)["correction_type"],
              )
            }
            className={fieldClassName(false)}
          >
            {correctionTypeSchema.options.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="correction-note" className="block text-sm font-medium">
            Contributor note
          </label>
          <textarea
            id="correction-note"
            rows={2}
            value={form.contributor_note}
            onChange={(e) => updateField("contributor_note", e.target.value)}
            placeholder="Optional context for reviewers"
            className={fieldClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_native_speaker}
              onChange={(e) => updateField("is_native_speaker", e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            Native speaker
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_profession_reviewer}
              onChange={(e) => updateField("is_profession_reviewer", e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            Profession reviewer
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            Save correction locally
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)]"
          >
            Cancel
          </button>
        </div>

        {message && (
          <p className="text-sm text-[var(--muted)]" role="status">
            {message}{" "}
            <Link href="/settings#corrections-queue" className="font-medium text-[var(--accent)] hover:underline">
              View corrections queue
            </Link>
          </p>
        )}
      </form>
    </FeatureCard>
  );
}
