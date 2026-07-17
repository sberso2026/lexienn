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
import { saveTranslatedPhrase } from "@/lib/storage/savedPhrasesStorage";

const translationModes: Array<{ value: TranslationMode; label: string }> = [
  { value: "natural", label: "Natural" },
  { value: "polite", label: "Formal" },
  { value: "simple", label: "Simple" },
  { value: "direct", label: "Literal" },
  { value: "speak_to_local", label: "Emergency" },
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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const targetResolved = resolveLanguageSelection(targetLanguageSelection);
  const isUnavailable = result?.source === "unavailable";
  const hasTranslation = Boolean(result && !isUnavailable && result.translated_text);
  const isSubmitting = requestState === "translating";
  const modeLabel =
    translationModes.find((m) => m.value === translationMode)?.label ?? "Natural";

  const { isPlaying, audioState, audioType, statusMessage, play, stop } = useVoicePlayback({
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
    stop();
    abortActiveRequest();
  }, [targetLanguageSelection, sourceLanguage, translationMode, userContext, abortActiveRequest, stop]);

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
    setSaveMessage(null);
    setShowExplanation(false);
    stop();
    stopVoicePlayback();
  }, [abortActiveRequest, stop]);

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
      setFormError("Check your languages and try again.");
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
          ? "Translation is temporarily unavailable. Try again or use an offline pack."
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

  const replayAudio = useCallback(() => {
    setAutoplayBlocked(false);
    void play("normal");
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

  const saveTranslation = useCallback(() => {
    if (!result?.translated_text) return;
    const outcome = saveTranslatedPhrase({
      sourceText: result.original_text,
      translatedText: result.translated_text,
      sourceLanguage,
      targetLanguage: targetResolved.base_language,
      pronunciation: result.pronunciation_simple,
    });
    setSaveMessage(
      outcome === "saved"
        ? "Saved to Library."
        : outcome === "duplicate"
          ? "Already saved in Library."
          : "Could not save this phrase.",
    );
  }, [result, sourceLanguage, targetResolved.base_language]);

  const swapLanguages = useCallback(() => {
    const nextSource = targetResolved.base_language;
    setTargetLanguageSelection(sourceLanguage);
    setSourceLanguage(nextSource);
    setResult(null);
    setFormError(null);
    stopVoicePlayback();
  }, [sourceLanguage, targetResolved.base_language]);

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
      <CompactCard className="enterprise-card">
        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Intelligent translation
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Translate naturally</h2>
          </div>
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
          <p className="-mt-1 text-right text-[10px] text-[var(--muted)]" aria-live="polite">
            {sentence.length} characters
          </p>

          <div className="grid grid-cols-[1fr_2.75rem_1fr] items-end gap-2">
            <SearchableLanguageSelectField
              id="translator_source_language"
              label="From"
              value={sourceLanguage}
              onChange={setSourceLanguage}
            />
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h11l-3-3m3 3l-3 3M17 17H6l3 3m-3-3l3-3" />
                </svg>
              }
              label="Swap source and target languages"
              onClick={swapLanguages}
            />
            <SearchableLanguageSelectField
              id="translator_target_language"
              label="To"
              value={targetLanguageSelection}
              onChange={setTargetLanguageSelection}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--muted)]">Translation mode</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Translation mode">
              {translationModes.map((mode) => {
                const selected = mode.value === translationMode;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTranslationMode(mode.value)}
                    className={`min-h-11 rounded-xl border px-3 text-xs font-semibold transition-colors ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
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
        <CompactCard className={`enterprise-card ${hasTranslation ? "pb-2" : ""}`}>
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
              <p className="break-words text-xl font-semibold leading-relaxed">{result.translated_text}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {fromName} → {toName}
              </p>

              {result.pronunciation_simple && (
                <p className="mt-3 rounded-xl bg-[var(--background)] px-3 py-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--foreground)]">Pronunciation:</span>{" "}
                  {result.pronunciation_simple}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {audioState === "audio_loading" && (
                  <StatusChip label="Loading audio…" variant="info" />
                )}
                {isPlaying && <StatusChip label="Playing" variant="info" />}
                {autoplayBlocked && (
                  <StatusChip label="Tap to play audio" variant="warning" />
                )}
                <IconButton
                  icon={
                    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Play translation audio"
                  disabled={audioState === "audio_loading" || isPlaying}
                  onClick={replayAudio}
                />
                <IconButton
                  icon={
                    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Repeat slowly"
                  disabled={audioState === "audio_loading" || isPlaying}
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
                <IconButton
                  icon={
                    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  }
                  label="Save translation"
                  onClick={saveTranslation}
                />
                <IconButton
                  icon={
                    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01M9.2 9a3 3 0 115.7 1.2c0 1.8-2.9 2.1-2.9 3.8" />
                    </svg>
                  }
                  label="Explain translation"
                  active={showExplanation}
                  onClick={() => setShowExplanation((value) => !value)}
                />
              </div>

              {showExplanation && (
                <div className="mt-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3 text-sm leading-relaxed">
                  {result.usage_note ||
                    result.natural_translation ||
                    `${modeLabel} translation from ${fromName} to ${toName}.`}
                </div>
              )}

              {saveMessage && (
                <p className="mt-2 text-xs text-[var(--muted)]" role="status" aria-live="polite">
                  {saveMessage}
                </p>
              )}

              {(statusMessage || audioState === "audio_error" || audioState === "audio_unavailable") && (
                <p
                  className={`mt-2 text-[10px] ${
                    audioState === "audio_error" || audioState === "audio_unavailable"
                      ? "text-red-600"
                      : "text-[var(--muted)]"
                  }`}
                  role="status"
                >
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
