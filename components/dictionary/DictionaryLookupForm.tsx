"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
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
  clearDictionaryResult,
  loadDictionaryResult,
  saveDictionaryResult,
} from "@/lib/dictionary/resultStorage";
import {
  loadDictionaryLookupForm,
  saveDictionaryLookupForm,
  saveDictionaryLookupFormFromQuery,
  type StoredDictionaryLookupForm,
} from "@/lib/dictionary/lookupFormStorage";
import {
  toUserFacingError,
  USER_LOOKUP_UNAVAILABLE,
} from "@/lib/ui/userFacingErrors";
import { useActiveRequest } from "@/hooks/useActiveRequest";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { buildDictionaryRequestKey } from "@/lib/request/requestKeys";
import {
  encodeLanguageSelection,
  resolveLanguageSelection,
  buildTranslationTargetPayload,
} from "@/lib/languages/languageOptions";
import { mockUserContextProfiles } from "@/lib/mock";
import { dictionaryQuerySchema } from "@/lib/schemas";
import type { UserContext } from "@/lib/schemas";

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

const enterpriseContexts: Array<{
  value: string;
  label: string;
  requestContext: UserContext;
}> = [
  { value: "general", label: "General", requestContext: "general" },
  { value: "engineering", label: "Engineering", requestContext: "engineer" },
  { value: "healthcare", label: "Healthcare", requestContext: "health_emergency" },
  { value: "travel", label: "Travel", requestContext: "traveller" },
  { value: "business", label: "Business", requestContext: "business_owner" },
  { value: "legal", label: "Legal", requestContext: "custom" },
  { value: "education", label: "Education", requestContext: "student" },
  { value: "emergency", label: "Emergency", requestContext: "health_emergency" },
];

function contextSelectionFor(context: UserContext): string {
  return enterpriseContexts.find((option) => option.requestContext === context)?.value ?? "general";
}

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
  const { abortActiveRequest, beginRequest, finishRequest, isActiveRequest, isAbortError } =
    useActiveRequest();
  const [form, setForm] = useState<FormState>(() => toFormState(null, preferences));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextSelection, setContextSelection] = useState(() =>
    contextSelectionFor(form.user_context),
  );
  const submitGenerationRef = useRef(0);

  const handleClear = useCallback(() => {
    submitGenerationRef.current += 1;
    abortActiveRequest();
    setForm((prev) => ({ ...prev, input_text: "" }));
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(false);
    clearDictionaryResult();
  }, [abortActiveRequest]);

  useEffect(() => {
    const saved = loadDictionaryLookupForm();
    if (saved) {
      const next = toFormState(saved, preferences);
      setForm(next);
      setContextSelection(contextSelectionFor(next.user_context));
      return;
    }

    const result = loadDictionaryResult();
    if (result?.query) {
      saveDictionaryLookupFormFromQuery(result.query);
      const next = toFormState(result.query as StoredDictionaryLookupForm, preferences);
      setForm(next);
      setContextSelection(contextSelectionFor(next.user_context));
    }
  }, [preferences]);

  useEffect(() => {
    if (!prefillText) return;
    setForm((prev) => ({ ...prev, input_text: prefillText }));
    onPrefillApplied?.();
  }, [prefillText, onPrefillApplied]);

  const contextLabel =
    enterpriseContexts.find((option) => option.value === contextSelection)?.label ??
    mockUserContextProfiles.find((p) => p.context === form.user_context)?.label ??
    "General";
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
      const generation = ++submitGenerationRef.current;
      const requestKey = buildDictionaryRequestKey(result.data);
      const signal = beginRequest(requestKey);

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

        const { response } = await generateDictionaryEntryViaApi(result.data, {
          signal,
        });
        if (generation !== submitGenerationRef.current || !isActiveRequest(requestKey)) return;

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
        void import("@/lib/analytics/appEvents").then(({ trackAppEvent }) => {
          trackAppEvent("dictionary_lookup_completed", {
            source: response.source,
            target: response.query.target_language,
          });
        });
      } catch (error) {
        if (isAbortError(error) || generation !== submitGenerationRef.current) {
          return;
        }
        if (!isActiveRequest(requestKey)) return;
        if (error instanceof DictionaryApiError) {
          setFormError(toUserFacingError(error.message, USER_LOOKUP_UNAVAILABLE));
        } else {
          console.error("[dictionary.lookup] unexpected_error", error);
          setFormError("Could not generate a dictionary result. Please try again.");
        }
      } finally {
        finishRequest(requestKey);
        if (generation === submitGenerationRef.current) {
          setIsSubmitting(false);
        }
      }
    })();
  }

  return (
    <CompactCard className="enterprise-card">
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Language intelligence
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Define a word or phrase</h2>
        </div>

        <VoiceInputTextArea
          id="input_text"
          label="Word or phrase"
          value={form.input_text}
          onChange={(value) => updateField("input_text", value)}
          placeholder="Search a word or phrase…"
          error={fieldErrors.input_text}
          required
          rows={2}
          languageHint={form.source_language}
          userContext={form.user_context}
          inputTarget="dictionary"
          compact
          showClear={form.input_text.trim().length > 0 || isSubmitting}
          onClear={handleClear}
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

        <SelectField
          id="user_context"
          label="Context"
          value={contextSelection}
          onChange={(value) => {
            const selected =
              enterpriseContexts.find((option) => option.value === value) ??
              enterpriseContexts[0];
            setContextSelection(selected.value);
            updateField("user_context", selected.requestContext);
          }}
          options={enterpriseContexts.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <ExpandableSection summary={`Options · ${levelLabel} · ${contextLabel}`}>
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
            disabled={isSubmitting || form.input_text.trim().length === 0}
            aria-busy={isSubmitting}
            fullWidth
          >
            {isSubmitting ? "Defining…" : "Define"}
          </ActionButton>
          <IconButton
            icon={
              <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h8M17 8l2 2-2 2" />
              </svg>
            }
            label="Switch to Translate"
            onClick={() => router.push("/translator")}
          />
        </div>
      </form>
    </CompactCard>
  );
}
