"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusChip } from "@/components/ui/StatusChip";
import { ActionButton } from "@/components/ui/ActionButton";
import { SearchableLanguageSelectField } from "@/components/ui/SearchableLanguageSelectField";
import { VoiceInputTextArea } from "@/components/speech/VoiceInputTextArea";
import { VoiceSourceBadge } from "@/components/voice/VoiceSourceBadge";
import { TranslationSourceBadge } from "@/components/ui/TranslationSourceBadge";
import { ValidationStatusBadge } from "@/components/ui/ValidationStatusBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { useActiveRequest } from "@/hooks/useActiveRequest";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import {
  resolveLanguageSelection,
  buildTranslationTargetPayload,
  getLanguageOptionByValue,
} from "@/lib/languages/languageOptions";
import { buildTranslationRequestKey } from "@/lib/request/requestKeys";
import { logPerf } from "@/lib/request/perfLog";
import type { TranslationMode, TranslatorResponse } from "@/lib/translator/translatorSchemas";
import {
  TranslatorApiError,
  translateSentenceViaApi,
} from "@/lib/translator/translatorApiClient";
import { translatorRequestSchema } from "@/lib/translator/translatorSchemas";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";
import { useVoicePlayback } from "@/lib/voice/useVoicePlayback";

const translationModes: Array<{ value: TranslationMode; label: string }> = [
  { value: "direct", label: "Direct" },
  { value: "natural", label: "Natural" },
  { value: "polite", label: "Polite" },
  { value: "simple", label: "Simple" },
  { value: "speak_to_local", label: "Local" },
];

type RequestUiState = "ready" | "translating" | "from_cache" | "error";

export function TextTranslatorView() {
  const { preferences } = useUserPreferences();
  const { abortActiveRequest, beginRequest, finishRequest, isActiveRequest, isAbortError } =
    useActiveRequest();
  const [sourceLanguage, setSourceLanguage] = useState(preferences.default_source_language);
  const [targetLanguageSelection, setTargetLanguageSelection] = useState(
    preferences.default_target_language,
  );
  const [userContext, setUserContext] = useState(preferences.default_user_context);
  const [translationMode, setTranslationMode] = useState<TranslationMode>(
    preferences.default_translation_mode,
  );
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<TranslatorResponse | null>(null);
  const [requestState, setRequestState] = useState<RequestUiState>("ready");
  const [formError, setFormError] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [autoplayRequestId, setAutoplayRequestId] = useState(0);
  const [copied, setCopied] = useState(false);

  const targetResolved = resolveLanguageSelection(targetLanguageSelection);
  const isUnavailable = result?.source === "unavailable";
  const hasTranslation = Boolean(result && !isUnavailable && result.translated_text);
  const isSubmitting = requestState === "translating";
  const modeLabel =
    translationModes.find((m) => m.value === translationMode)?.label ?? "Natural";

  const { isPlaying, audioType, statusMessage, play } = useVoicePlayback({
    text: result?.translated_text ?? "",
    language: targetResolved.base_language,
    languageSelection: targetLanguageSelection,
    dialect: targetResolved.dialect_variant,
    pronunciationSimple: result?.pronunciation_simple,
    disabled: !hasTranslation,
  });

  const playRef = useRef(play);
  playRef.current = play;
  const submitGenerationRef = useRef(0);

  useEffect(() => {
    setSourceLanguage(preferences.default_source_language);
    setTargetLanguageSelection(preferences.default_target_language);
    setUserContext(preferences.default_user_context);
    setTranslationMode(preferences.default_translation_mode);
  }, [preferences]);

  useEffect(() => () => stopVoicePlayback(), []);
  useEffect(() => {
    stopVoicePlayback();
    abortActiveRequest();
  }, [targetLanguageSelection, sourceLanguage, translationMode, userContext, abortActiveRequest]);

  useEffect(() => {
    if (autoplayRequestId === 0 || !result?.translated_text || isUnavailable) return;
    void playRef.current("normal").then((playResult) => {
      if (playResult.autoplayBlocked) setAutoplayBlocked(true);
    });
  }, [result, isUnavailable, autoplayRequestId]);

  const handleClear = useCallback(() => {
    submitGenerationRef.current += 1;
    abortActiveRequest();
    setSentence("");
    setResult(null);
    setFormError(null);
    setRequestState("ready");
    setAutoplayBlocked(false);
    stopVoicePlayback();
  }, [abortActiveRequest]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const generation = ++submitGenerationRef.current;
    setFormError(null);
    setAutoplayBlocked(false);
    setRequestState("translating");

    const targetFields = buildTranslationTargetPayload(targetLanguageSelection);
    const payload = {
      input_text: sentence,
      source_language: sourceLanguage,
      ...targetFields,
      user_context: userContext,
      translation_mode: translationMode,
      ai_translation_enabled: preferences.ai_translation_enabled,
      rule_fallback_enabled: preferences.rule_fallback_enabled,
    };

    const parsed = translatorRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid request.");
      setRequestState("ready");
      return;
    }

    const requestKey = buildTranslationRequestKey(parsed.data);
    const signal = beginRequest(requestKey);
    const startedAt = Date.now();
    logPerf("translation_start", { durationMs: 0 });

    try {
      const { response, fromCache } = await translateSentenceViaApi(parsed.data, { signal });
      if (generation !== submitGenerationRef.current || !isActiveRequest(requestKey)) return;

      setResult(response);
      setRequestState(fromCache ? "from_cache" : "ready");
      if (!fromCache) {
        setAutoplayRequestId((id) => id + 1);
      }
      logPerf("translation_applied", {
        durationMs: Date.now() - startedAt,
        fromCache,
      });
    } catch (error) {
      if (isAbortError(error) || generation !== submitGenerationRef.current) {
        return;
      }
      if (!isActiveRequest(requestKey)) return;
      setFormError(
        error instanceof TranslatorApiError
          ? error.message
          : "Could not translate. Try again.",
      );
      setRequestState("error");
      if (!(error instanceof TranslatorApiError)) {
        console.error("[translator.translate] unexpected_error", error);
      }
    } finally {
      finishRequest(requestKey);
      if (generation !== submitGenerationRef.current) return;
      setRequestState((state) => (state === "translating" ? "ready" : state));
    }
  }

  const repeatSlowly = useCallback(() => {
    setAutoplayBlocked(false);
    void play("slow");
  }, [play]);

  const copyTranslation = useCallback(async () => {
    if (!result?.translated_text) return;
    try {
      await navigator.clipboard.writeText(result.translated_text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [result?.translated_text]);

  const fromName =
    getLanguageOptionByValue(sourceLanguage)?.display_name ?? sourceLanguage;
  const toName =
    getLanguageOptionByValue(targetLanguageSelection)?.display_label ?? "Target";

  const submitLabel =
    requestState === "translating"
      ? "Translating…"
      : requestState === "from_cache"
        ? "Translate"
        : "Translate";

  return (
    <div className="space-y-3">
      <CompactCard>
        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <VoiceInputTextArea
            id="translator_sentence"
            label="Sentence"
            value={sentence}
            onChange={setSentence}
            rows={3}
            placeholder="Speak or type sentence…"
            error={formError ?? undefined}
            languageHint={sourceLanguage}
            userContext={userContext}
            inputTarget="translator"
            compact
            showClear={sentence.trim().length > 0 || Boolean(result)}
            onClear={handleClear}
          />

          <div className="grid grid-cols-2 gap-2">
            <SearchableLanguageSelectField
              id="translator_source_language"
              label="From"
              value={sourceLanguage}
              onChange={setSourceLanguage}
            />
            <SearchableLanguageSelectField
              id="translator_target_language"
              label="To"
              value={targetLanguageSelection}
              onChange={setTargetLanguageSelection}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <StatusChip label={`Mode: ${modeLabel}`} variant="accent" />
            <select
              id="translator_mode"
              value={translationMode}
              onChange={(e) => setTranslationMode(e.target.value as TranslationMode)}
              className="min-h-9 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-2 text-xs font-medium"
              aria-label="Translation mode"
            >
              {translationModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {requestState === "from_cache" && (
            <p className="text-[10px] font-medium text-[var(--muted)]" role="status">
              Loaded from recent cache
            </p>
          )}

          {formError && <CompactAlert variant="error">{formError}</CompactAlert>}

          <ActionButton
            type="submit"
            fullWidth
            disabled={isSubmitting || sentence.trim().length === 0}
            aria-busy={isSubmitting}
          >
            {submitLabel}
          </ActionButton>
        </form>
      </CompactCard>

      {isSubmitting && <LoadingState title="Translating" label="Translating…" />}

      {result && !isSubmitting && (
        <CompactCard className={hasTranslation ? "pb-2" : ""}>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <TranslationSourceBadge source={result.source} />
            {!isUnavailable && (
              <>
                <ValidationStatusBadge status={result.validation_status} />
                <ConfidenceBadge score={result.confidence_score} />
                {audioType && <VoiceSourceBadge audioType={audioType} />}
              </>
            )}
          </div>

          {isUnavailable && result.unavailable_reason && (
            <CompactAlert variant="warning">{result.unavailable_reason}</CompactAlert>
          )}

          {hasTranslation && (
            <>
              <p className="text-lg font-semibold leading-snug">{result.translated_text}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {fromName} ⇄ {toName}
              </p>

              <div className="mt-3 flex items-center gap-2">
                {isPlaying && <StatusChip label="Playing" variant="info" />}
                {autoplayBlocked && (
                  <StatusChip label="Tap slow replay" variant="warning" />
                )}
                <IconButton
                  icon={
                    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Repeat slowly"
                  disabled={isPlaying}
                  onClick={repeatSlowly}
                />
                <IconButton
                  icon={
                    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  }
                  label={copied ? "Copied" : "Copy translation"}
                  onClick={() => void copyTranslation()}
                />
              </div>

              {statusMessage && !autoplayBlocked && (
                <p className="mt-2 text-[10px] text-[var(--muted)]" role="status">
                  {statusMessage}
                </p>
              )}
            </>
          )}
        </CompactCard>
      )}
    </div>
  );
}
