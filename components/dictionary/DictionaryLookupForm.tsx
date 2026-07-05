"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { IconButton } from "@/components/ui/IconButton";
import { SearchableLanguageSelectField } from "@/components/ui/SearchableLanguageSelectField";
import { SelectField } from "@/components/ui/SelectField";
import { VoiceInputTextArea } from "@/components/speech/VoiceInputTextArea";
import {
  DictionaryApiError,
  generateDictionaryEntryViaApi,
} from "@/lib/dictionary/dictionaryApiClient";
import {
  loadDictionaryResult,
  saveDictionaryResult,
} from "@/lib/dictionary/resultStorage";
import {
  loadDictionaryLookupForm,
  saveDictionaryLookupForm,
  saveDictionaryLookupFormFromQuery,
  type StoredDictionaryLookupForm,
} from "@/lib/dictionary/lookupFormStorage";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import {
  encodeLanguageSelection,
  resolveLanguageSelection,
  buildTranslationTargetPayload,
} from "@/lib/languages/languageOptions";
import { mockUserContextProfiles } from "@/lib/mock";
import { dictionaryQuerySchema } from "@/lib/schemas";

const explanationLevels = [
  { value: "simple", label: "Simple" },
  { value: "normal", label: "Normal" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
] as const;

const outputModes = [
  { value: "explain", label: "Explain" },
  { value: "translate", label: "Translate" },
  { value: "explain_and_translate", label: "Explain & translate" },
  { value: "speak_to_local", label: "Speak to local" },
] as const;

type FormState = StoredDictionaryLookupForm & {
  target_language_selection: string;
};

function toFormState(
  stored: StoredDictionaryLookupForm | null,
  defaults: ReturnType<typeof useUserPreferences>["preferences"],
): FormState {
  const targetSelection = stored
    ? encodeLanguageSelection(stored.target_language, stored.target_dialect || undefined)
    : defaults.default_target_language;

  return {
    input_text: stored?.input_text ?? "",
    source_language: stored?.source_language ?? defaults.default_source_language,
    target_language: stored?.target_language ?? resolveLanguageSelection(targetSelection).base_language,
    target_dialect: stored?.target_dialect ?? "",
    target_language_selection: targetSelection,
    user_context: stored?.user_context ?? defaults.default_user_context,
    explanation_level:
      stored?.explanation_level ?? defaults.default_explanation_level,
    output_mode: stored?.output_mode ?? "explain_and_translate",
  };
}

interface DictionaryLookupFormProps {
  prefillText?: string;
  onPrefillApplied?: () => void;
}

export function DictionaryLookupForm({
  prefillText = "",
  onPrefillApplied,
}: DictionaryLookupFormProps) {
  const router = useRouter();
  const { preferences } = useUserPreferences();
  const [form, setForm] = useState<FormState>(() => toFormState(null, preferences));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = loadDictionaryLookupForm();
    if (saved) {
      setForm(toFormState(saved, preferences));
      return;
    }

    const result = loadDictionaryResult();
    if (result?.query) {
      saveDictionaryLookupFormFromQuery(result.query);
      setForm(toFormState(result.query as StoredDictionaryLookupForm, preferences));
    }
  }, [preferences]);

  useEffect(() => {
    if (!prefillText) return;
    setForm((prev) => ({ ...prev, input_text: prefillText }));
    onPrefillApplied?.();
  }, [prefillText, onPrefillApplied]);

  const contextLabel =
    mockUserContextProfiles.find((p) => p.context === form.user_context)?.label ?? "General";
  const levelLabel =
    explanationLevels.find((l) => l.value === form.explanation_level)?.label ?? "Normal";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "target_language_selection") {
        const resolved = resolveLanguageSelection(String(value));
        next.target_language = resolved.base_language;
        next.target_dialect = resolved.dialect_variant ?? "";
      }
      return next;
    });

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const targetFields = buildTranslationTargetPayload(form.target_language_selection);
    const payload = {
      input_text: form.input_text.trim(),
      source_language: form.source_language,
      ...targetFields,
      user_context: form.user_context,
      explanation_level: form.explanation_level,
      output_mode: form.output_mode,
    };

    const result = dictionaryQuerySchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !errors[path]) {
          errors[path] = issue.message;
        }
      }
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    void (async () => {
      try {
        saveDictionaryLookupForm({
          input_text: form.input_text,
          source_language: form.source_language,
          target_language: targetFields.target_language,
          target_dialect: targetFields.target_dialect ?? "",
          user_context: form.user_context,
          explanation_level: form.explanation_level,
          output_mode: form.output_mode,
        });

        const response = await generateDictionaryEntryViaApi(result.data);
        saveDictionaryLookupFormFromQuery(response.query);
        saveDictionaryResult({
          query: response.query,
          entry: response.entry,
          source: response.source,
          diagnostics: response.diagnostics,
        });

        const params = new URLSearchParams({
          input: response.query.input_text,
          target: response.query.target_language,
          context: response.query.user_context,
        });
        router.push(`/dictionary/result?${params.toString()}`);
      } catch (error) {
        if (error instanceof DictionaryApiError) {
          setFormError(error.message);
        } else {
          setFormError("Could not generate a dictionary result. Please try again.");
        }
        setIsSubmitting(false);
      }
    })();
  }

  return (
    <CompactCard>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <VoiceInputTextArea
          id="input_text"
          label="Word or phrase"
          value={form.input_text}
          onChange={(value) => updateField("input_text", value)}
          placeholder="Speak or type word/phrase…"
          error={fieldErrors.input_text}
          required
          rows={2}
          languageHint={form.source_language}
          userContext={form.user_context}
          inputTarget="dictionary"
          disabled={isSubmitting}
          compact
        />

        <div className="grid grid-cols-2 gap-2">
          <SearchableLanguageSelectField
            id="source_language"
            label="From"
            value={form.source_language}
            onChange={(value) => updateField("source_language", value)}
            error={fieldErrors.source_language}
          />
          <SearchableLanguageSelectField
            id="target_language"
            label="To"
            value={form.target_language_selection}
            onChange={(value) => updateField("target_language_selection", value)}
            error={fieldErrors.target_language}
            required
          />
        </div>

        <ExpandableSection summary={`Options: ${contextLabel} · ${levelLabel}`}>
          <SelectField
            id="user_context"
            label="Context"
            value={form.user_context}
            onChange={(value) =>
              updateField("user_context", value as FormState["user_context"])
            }
            options={mockUserContextProfiles.map((profile) => ({
              value: profile.context,
              label: profile.label,
            }))}
          />
          <SelectField
            id="explanation_level"
            label="Level"
            value={form.explanation_level}
            onChange={(value) =>
              updateField("explanation_level", value as FormState["explanation_level"])
            }
            options={explanationLevels.map((level) => ({
              value: level.value,
              label: level.label,
            }))}
          />
          <SelectField
            id="output_mode"
            label="Output"
            value={form.output_mode}
            onChange={(value) =>
              updateField("output_mode", value as FormState["output_mode"])
            }
            options={outputModes.map((mode) => ({
              value: mode.value,
              label: mode.label,
            }))}
          />
        </ExpandableSection>

        {formError && <CompactAlert variant="error">{formError}</CompactAlert>}

        <div className="flex items-center gap-2 pt-1">
          <ActionButton
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            fullWidth
          >
            {isSubmitting ? "Defining…" : "Define"}
          </ActionButton>
          <Link href="/translator" className="shrink-0">
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h8M17 8l2 2-2 2" />
                </svg>
              }
              label="Switch to Translate"
            />
          </Link>
        </div>
      </form>
    </CompactCard>
  );
}
