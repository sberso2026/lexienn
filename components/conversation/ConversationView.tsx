"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ConversationBigScreen } from "@/components/conversation/ConversationBigScreen";
import { ConversationSpeakerPanel } from "@/components/conversation/ConversationSpeakerPanel";
import { ResultCorrectionActions } from "@/components/corrections/ResultCorrectionActions";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { useActiveRequest } from "@/hooks/useActiveRequest";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isAutomaticLanguageDetectionEnabled } from "@/lib/config/publicEnv";
import {
  CONVERSATION_INTELLIGENCE_OFFERS,
  type ConversationSpeaker,
  type ConversationTurn,
} from "@/lib/conversation/conversationTypes";
import { saveConversationSession } from "@/lib/conversation/conversationStorage";
import {
  applyDetectedLanguageToSide,
  canTranslateSpeakerTurn,
  createConversationTurn,
  resolveLanguagesForSpeaker,
  swapConversationPair,
  voicePlaybackLanguageForTurn,
} from "@/lib/conversation/conversationTurn";
import {
  AUTO_DETECT_LABEL,
  AUTO_DETECT_LANGUAGE,
  decideSpokenLanguageDetection,
  isAutoDetectLanguage,
  type SpokenLanguageDetectionResult,
} from "@/lib/languages/spokenLanguageDetection";
import {
  buildTranslationTargetPayload,
  getLanguageOptionByValue,
} from "@/lib/languages/languageOptions";
import { buildTranslationRequestKey } from "@/lib/request/requestKeys";
import { saveTranslatedPhrase } from "@/lib/storage/savedPhrasesStorage";
import {
  TranslatorApiError,
  translateSentenceViaApi,
} from "@/lib/translator/translatorApiClient";
import { translatorRequestSchema } from "@/lib/translator/translatorSchemas";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";
import { useVoicePlayback } from "@/lib/voice/useVoicePlayback";

type DetectionUi = {
  speaker: ConversationSpeaker;
  message: string;
  pendingValue: string | null;
  needsConfirm: boolean;
};

function languageLabel(value: string): string {
  if (isAutoDetectLanguage(value)) return AUTO_DETECT_LABEL;
  return getLanguageOptionByValue(value)?.display_label ?? value;
}

export function ConversationView() {
  const { preferences } = useUserPreferences();
  const autoDetectEnabled = isAutomaticLanguageDetectionEnabled();
  const { abortActiveRequest, beginRequest, finishRequest, isActiveRequest, isAbortError } =
    useActiveRequest();

  const [personALanguage, setPersonALanguage] = useState(
    autoDetectEnabled ? AUTO_DETECT_LANGUAGE : preferences.default_source_language,
  );
  const [personBLanguage, setPersonBLanguage] = useState(preferences.default_target_language);
  const [draftA, setDraftA] = useState("");
  const [draftB, setDraftB] = useState("");
  const [activeSpeaker, setActiveSpeaker] = useState<ConversationSpeaker | null>(null);
  const [paused, setPaused] = useState(false);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectionUi, setDetectionUi] = useState<DetectionUi | null>(null);
  const [bigScreen, setBigScreen] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [autoplayRequestId, setAutoplayRequestId] = useState(0);

  const pair = useMemo(
    () => ({ personALanguage, personBLanguage }),
    [personALanguage, personBLanguage],
  );

  const latestTurn = turns[0] ?? null;
  const playbackLanguage = latestTurn
    ? voicePlaybackLanguageForTurn(latestTurn)
    : personBLanguage;

  const {
    isPlaying,
    audioState,
    statusMessage: voiceStatus,
    play,
    stop,
  } = useVoicePlayback({
    text: latestTurn?.translatedText ?? "",
    language: playbackLanguage,
    languageSelection: playbackLanguage,
    pronunciationSimple: latestTurn?.pronunciation,
    disabled: !latestTurn?.translatedText,
  });

  const playRef = useRef(play);
  playRef.current = play;
  const generationRef = useRef(0);

  useEffect(() => () => stopVoicePlayback(), []);

  useEffect(() => {
    if (autoplayRequestId === 0 || !latestTurn?.translatedText) return;
    void playRef.current("normal");
  }, [autoplayRequestId, latestTurn?.translatedText]);

  const leadingOptions = autoDetectEnabled
    ? [{ value: AUTO_DETECT_LANGUAGE, label: AUTO_DETECT_LABEL }]
    : undefined;

  const handleDetection = useCallback(
    (speaker: ConversationSpeaker, detection: SpokenLanguageDetectionResult) => {
      if (!autoDetectEnabled) return;
      const current =
        speaker === "a" ? personALanguage : personBLanguage;
      if (!isAutoDetectLanguage(current)) return;

      setActiveSpeaker(speaker);
      const decision = decideSpokenLanguageDetection(detection);
      if (decision.action === "apply" && decision.catalogValue) {
        const next = applyDetectedLanguageToSide(speaker, pair, decision.catalogValue);
        setPersonALanguage(next.personALanguage);
        setPersonBLanguage(next.personBLanguage);
        setDetectionUi({
          speaker,
          message: decision.message,
          pendingValue: null,
          needsConfirm: false,
        });
        return;
      }
      if (decision.action === "confirm" && decision.catalogValue) {
        setDetectionUi({
          speaker,
          message: decision.message,
          pendingValue: decision.catalogValue,
          needsConfirm: true,
        });
        return;
      }
      setDetectionUi({
        speaker,
        message: decision.message,
        pendingValue: null,
        needsConfirm: false,
      });
    },
    [autoDetectEnabled, pair, personALanguage, personBLanguage],
  );

  const confirmDetection = useCallback(() => {
    if (!detectionUi?.pendingValue || !detectionUi.speaker) return;
    const next = applyDetectedLanguageToSide(
      detectionUi.speaker,
      pair,
      detectionUi.pendingValue,
    );
    setPersonALanguage(next.personALanguage);
    setPersonBLanguage(next.personBLanguage);
    setDetectionUi({
      speaker: detectionUi.speaker,
      message: `Detected: ${languageLabel(detectionUi.pendingValue)}`,
      pendingValue: null,
      needsConfirm: false,
    });
  }, [detectionUi, pair]);

  const runTurn = useCallback(
    async (speaker: ConversationSpeaker) => {
      if (paused) {
        setFormError("Conversation is paused. Resume to continue.");
        return;
      }

      const draft = speaker === "a" ? draftA : draftB;
      if (!draft.trim()) {
        setFormError("Enter or speak text before translating a turn.");
        return;
      }

      const gate = canTranslateSpeakerTurn(speaker, pair);
      if (!gate.ok) {
        setFormError(gate.reason);
        return;
      }

      const { sourceLanguage, targetLanguage } = resolveLanguagesForSpeaker(speaker, pair);
      const generation = ++generationRef.current;
      setActiveSpeaker(speaker);
      setFormError(null);
      setStatusMessage(null);
      setIsTranslating(true);
      stopVoicePlayback();
      stop();

      const targetFields = buildTranslationTargetPayload(targetLanguage);
      const payload = {
        input_text: draft,
        source_language: sourceLanguage,
        ...targetFields,
        user_context: preferences.default_user_context,
        translation_mode: "natural" as const,
        ai_translation_enabled: preferences.ai_translation_enabled,
        rule_fallback_enabled: preferences.rule_fallback_enabled,
      };

      const parsed = translatorRequestSchema.safeParse(payload);
      if (!parsed.success) {
        setFormError("Check languages and try again.");
        setIsTranslating(false);
        return;
      }

      const requestKey = buildTranslationRequestKey(parsed.data);
      const signal = beginRequest(requestKey);

      try {
        const { response } = await translateSentenceViaApi(parsed.data, { signal });
        if (generation !== generationRef.current || !isActiveRequest(requestKey)) return;

        if (response.source === "unavailable" || !response.translated_text) {
          setFormError(
            response.unavailable_reason ??
              "Translation is temporarily unavailable for this turn.",
          );
          return;
        }

        const turn = createConversationTurn({
          speaker,
          sourceLanguage,
          targetLanguage,
          sourceText: response.original_text || draft,
          translatedText: response.translated_text,
          pronunciation: response.pronunciation_simple,
        });
        setTurns((prev) => [turn, ...prev]);
        if (speaker === "a") setDraftA("");
        else setDraftB("");
        setAutoplayRequestId((id) => id + 1);
        setStatusMessage(`Turn translated for ${speaker === "a" ? "Person B" : "Person A"}.`);
      } catch (error) {
        if (isAbortError(error) || generation !== generationRef.current) return;
        setFormError(
          error instanceof TranslatorApiError
            ? "Translation failed. Try again."
            : "Could not translate this turn.",
        );
      } finally {
        finishRequest(requestKey);
        if (generation === generationRef.current) setIsTranslating(false);
      }
    },
    [
      beginRequest,
      draftA,
      draftB,
      finishRequest,
      isAbortError,
      isActiveRequest,
      pair,
      paused,
      preferences.ai_translation_enabled,
      preferences.default_user_context,
      preferences.rule_fallback_enabled,
      stop,
    ],
  );

  const clearConversation = useCallback(() => {
    generationRef.current += 1;
    abortActiveRequest();
    stopVoicePlayback();
    stop();
    setTurns([]);
    setDraftA("");
    setDraftB("");
    setFormError(null);
    setStatusMessage(null);
    setDetectionUi(null);
    setShowIntelligence(false);
    setActiveSpeaker(null);
  }, [abortActiveRequest, stop]);

  const reversePair = useCallback(() => {
    const next = swapConversationPair(pair);
    setPersonALanguage(next.personALanguage);
    setPersonBLanguage(next.personBLanguage);
    setDetectionUi(null);
    setStatusMessage("Language pair reversed.");
  }, [pair]);

  const saveConversation = useCallback(() => {
    const outcome = saveConversationSession({
      personALanguage,
      personBLanguage,
      turns,
    });
    if (outcome === "empty") {
      setFormError("Add at least one turn before saving.");
      return;
    }
    if (outcome === "error") {
      setFormError("Could not save conversation.");
      return;
    }
    setStatusMessage("Conversation saved on this device.");
    setShowIntelligence(true);
  }, [personALanguage, personBLanguage, turns]);

  const saveLatestPhrase = useCallback(() => {
    if (!latestTurn) return;
    const outcome = saveTranslatedPhrase({
      sourceText: latestTurn.sourceText,
      translatedText: latestTurn.translatedText,
      sourceLanguage: latestTurn.sourceLanguage,
      targetLanguage: latestTurn.targetLanguage,
      pronunciation: latestTurn.pronunciation,
    });
    setStatusMessage(
      outcome === "saved"
        ? "Phrase saved to Library."
        : outcome === "duplicate"
          ? "Phrase already in Library."
          : "Could not save phrase.",
    );
  }, [latestTurn]);

  const voiceUnavailable =
    audioState === "audio_unavailable" || audioState === "audio_error"
      ? voiceStatus ?? "Voice unavailable for this language or browser."
      : null;

  return (
    <div className="space-y-4">
      <CompactCard className="enterprise-card space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Live conversation
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Conversation</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tap-to-speak turns for Person A and Person B. Automatic turn detection stays off until
            manual mode is stable.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton
            type="button"
            variant="secondary"
            className="!min-h-12"
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Resume" : "Pause"}
          </ActionButton>
          <ActionButton type="button" variant="secondary" className="!min-h-12" onClick={reversePair}>
            Reverse languages
          </ActionButton>
          <ActionButton
            type="button"
            variant="secondary"
            className="!min-h-12"
            onClick={() => setBigScreen(true)}
          >
            Big Screen
          </ActionButton>
          <ActionButton
            type="button"
            variant="secondary"
            className="!min-h-12"
            onClick={saveConversation}
            disabled={turns.length === 0}
          >
            Save conversation
          </ActionButton>
          <ActionButton type="button" variant="ghost" className="!min-h-12" onClick={clearConversation}>
            Clear
          </ActionButton>
        </div>

        <p className="text-xs text-[var(--muted)]">
          Conversations are not auto-saved. Saving is always an explicit action.
        </p>
      </CompactCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <ConversationSpeakerPanel
          speaker="a"
          title="Person A"
          languageValue={personALanguage}
          onLanguageChange={(value) => {
            setPersonALanguage(value);
            setDetectionUi(null);
            setActiveSpeaker("a");
          }}
          leadingOptions={leadingOptions}
          draftText={draftA}
          onDraftChange={(value) => {
            setDraftA(value);
            setActiveSpeaker("a");
          }}
          isActive={activeSpeaker === "a"}
          isPaused={paused}
          isBusy={isTranslating}
          userContext={preferences.default_user_context}
          onLanguageDetection={(detection) => handleDetection("a", detection)}
          onSpeakTurn={() => void runTurn("a")}
        />
        <ConversationSpeakerPanel
          speaker="b"
          title="Person B"
          languageValue={personBLanguage}
          onLanguageChange={(value) => {
            setPersonBLanguage(value);
            setDetectionUi(null);
            setActiveSpeaker("b");
          }}
          leadingOptions={leadingOptions}
          draftText={draftB}
          onDraftChange={(value) => {
            setDraftB(value);
            setActiveSpeaker("b");
          }}
          isActive={activeSpeaker === "b"}
          isPaused={paused}
          isBusy={isTranslating}
          userContext={preferences.default_user_context}
          onLanguageDetection={(detection) => handleDetection("b", detection)}
          onSpeakTurn={() => void runTurn("b")}
        />
      </div>

      {detectionUi && (
        <CompactCard className="space-y-2">
          <p className="text-sm" role="status">
            {detectionUi.speaker === "a" ? "Person A" : "Person B"}: {detectionUi.message}
          </p>
          {detectionUi.needsConfirm && detectionUi.pendingValue && (
            <div className="flex flex-wrap gap-2">
              <ActionButton type="button" onClick={confirmDetection}>
                Use {languageLabel(detectionUi.pendingValue)}
              </ActionButton>
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setDetectionUi(null)}
              >
                Keep Auto Detect
              </ActionButton>
            </div>
          )}
        </CompactCard>
      )}

      {formError && <CompactAlert variant="error">{formError}</CompactAlert>}
      {statusMessage && (
        <p className="text-sm text-[var(--muted)]" role="status">
          {statusMessage}
        </p>
      )}
      {voiceUnavailable && !bigScreen && (
        <CompactAlert variant="warning">{voiceUnavailable}</CompactAlert>
      )}

      {isTranslating && <LoadingState title="Translating" label="Translating turn…" />}

      {latestTurn && !isTranslating && (
        <CompactCard className="enterprise-card space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Latest · {latestTurn.speaker === "a" ? "Person A → B" : "Person B → A"}
            </p>
            {isPlaying && (
              <span className="text-xs font-semibold text-[var(--accent)]">Playing</span>
            )}
          </div>
          <p className="text-2xl font-semibold leading-relaxed">{latestTurn.translatedText}</p>
          <p className="text-sm text-[var(--muted)]">{latestTurn.sourceText}</p>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              type="button"
              variant="secondary"
              className="!min-h-12"
              onClick={() => void play("normal")}
            >
              Repeat
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              className="!min-h-12"
              onClick={() => void play("slow")}
            >
              Slow
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              className="!min-h-12"
              onClick={saveLatestPhrase}
            >
              Save phrase
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              className="!min-h-12"
              onClick={() => setBigScreen(true)}
            >
              Big Screen
            </ActionButton>
          </div>
          <ResultCorrectionActions
            defaults={{
              original_text: latestTurn.sourceText,
              current_translation: latestTurn.translatedText,
              language: latestTurn.targetLanguage,
              source_language: latestTurn.sourceLanguage,
              source_type: "translator",
              user_context: preferences.default_user_context,
              correction_type: "translation",
            }}
          />
        </CompactCard>
      )}

      {turns.length > 0 && (
        <CompactCard className="space-y-3">
          <h2 className="text-sm font-semibold">Transcript history</h2>
          <ol className="space-y-3">
            {turns.map((turn) => (
              <li
                key={turn.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {turn.speaker === "a" ? "Person A" : "Person B"} ·{" "}
                  {languageLabel(turn.sourceLanguage)} → {languageLabel(turn.targetLanguage)}
                </p>
                <p className="mt-1 text-base font-semibold">{turn.translatedText}</p>
                <p className="text-sm text-[var(--muted)]">{turn.sourceText}</p>
              </li>
            ))}
          </ol>
        </CompactCard>
      )}

      {showIntelligence && (
        <CompactCard className="space-y-3">
          <h2 className="text-sm font-semibold">After this conversation</h2>
          <p className="text-xs text-[var(--muted)]">
            Optional follow-ups. Nothing extra is saved unless you choose it.
          </p>
          <ul className="space-y-2">
            {CONVERSATION_INTELLIGENCE_OFFERS.map((offer) => (
              <li key={offer.id}>
                <ActionButton
                  type="button"
                  variant="secondary"
                  fullWidth
                  className="!min-h-12 !justify-start text-left"
                  onClick={() => {
                    if (offer.id === "save_phrases") {
                      saveLatestPhrase();
                      return;
                    }
                    setStatusMessage(`${offer.label} is queued for a later learning pass.`);
                  }}
                >
                  <span>
                    <span className="block font-semibold">{offer.label}</span>
                    <span className="block text-xs font-normal text-[var(--muted)]">
                      {offer.description}
                    </span>
                  </span>
                </ActionButton>
              </li>
            ))}
          </ul>
        </CompactCard>
      )}

      <p className="text-sm text-[var(--muted)]">
        Need typed translation only?{" "}
        <Link
          href="/translator"
          className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Back to Translate
        </Link>
      </p>

      {bigScreen && (
        <ConversationBigScreen
          turn={latestTurn}
          personALabel={languageLabel(personALanguage)}
          personBLabel={languageLabel(personBLanguage)}
          voiceUnavailable={voiceUnavailable}
          onClose={() => setBigScreen(false)}
          onReplay={() => void play("normal")}
          onSlow={() => void play("slow")}
        />
      )}
    </div>
  );
}
