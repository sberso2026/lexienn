"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraTranslationResultCard } from "@/components/translator/CameraTranslationResultCard";
import { ImageCaptureCard } from "@/components/translator/ImageCaptureCard";
import { OcrResultEditor } from "@/components/translator/OcrResultEditor";
import { DocumentIntelligenceActions } from "@/components/lens/DocumentIntelligenceActions";
import { LensImageTools } from "@/components/lens/LensImageTools";
import { TapToDefineSheet } from "@/components/lens/TapToDefineSheet";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { SearchableLanguageSelectField } from "@/components/ui/SearchableLanguageSelectField";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { buildTranslationTargetPayload, resolveLanguageSelection } from "@/lib/languages/languageOptions";
import {
  extractTextFromImageViaClient,
  isBrowserOnline,
  OcrApiError,
} from "@/lib/ocr/ocrClient";
import { prepareOcrImageFile, revokeObjectUrl } from "@/lib/ocr/imageUtils";
import type { OcrAcceptedMimeType } from "@/lib/ocr/imageUtils";
import type { OcrExtractResponse } from "@/lib/ocr/ocrSchemas";
import {
  saveOcrMissingTranslationRequest,
  tryTranslateOcrTextOffline,
} from "@/lib/ocr/ocrOfflineBridge";
import type { TranslationMode, TranslatorResponse } from "@/lib/translator/translatorSchemas";
import {
  TranslatorApiError,
  translateSentenceViaApi,
} from "@/lib/translator/translatorApiClient";
import { translatorRequestSchema } from "@/lib/translator/translatorSchemas";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";
import { useVoicePlayback } from "@/lib/voice/useVoicePlayback";
import { assessOcrImageQuality } from "@/lib/lens/imageQuality";
import { enhanceOcrContrast, rotateOcrImage } from "@/lib/lens/imageTransforms";
import { mergeOcrTextWithBlocks } from "@/lib/lens/ocrBlocks";
import {
  runLocalDocumentIntelligence,
  type DocumentIntelligenceResult,
} from "@/lib/lens/documentIntelligence";
import { saveLensScanHistoryItem } from "@/lib/lens/lensScanHistory";
import { LENS_SAFETY_DISCLAIMER, type LensDocumentActionId } from "@/lib/lens/lensTypes";

const AUTO_DETECT = "auto";

type CameraTranslatorViewProps = {
  preferCamera?: boolean;
  preferImport?: boolean;
};

export function CameraTranslatorView({
  preferCamera = false,
  preferImport = false,
}: CameraTranslatorViewProps) {
  const { preferences } = useUserPreferences();
  const [sourceLanguage, setSourceLanguage] = useState<string>(AUTO_DETECT);
  const [targetLanguageSelection, setTargetLanguageSelection] = useState(
    preferences.default_target_language,
  );
  const [userContext] = useState(preferences.default_user_context);
  const translationMode: TranslationMode = preferences.default_translation_mode;
  const [isOnline, setIsOnline] = useState(true);
  const [ocrModeLabel, setOcrModeLabel] = useState("Manual");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<OcrAcceptedMimeType | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrExtractResponse | null>(null);
  const [correctedText, setCorrectedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslatorResponse | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [autoplayRequestId, setAutoplayRequestId] = useState(0);
  const [qualityMessages, setQualityMessages] = useState<string[]>([]);
  const [defineWord, setDefineWord] = useState<string | null>(null);
  const [docResult, setDocResult] = useState<DocumentIntelligenceResult | null>(null);
  const [objectHint, setObjectHint] = useState<string | null>(null);

  const developerModeActive =
    isDeveloperModeFeatureEnabled() && preferences.developer_mode_enabled;
  const targetResolved = resolveLanguageSelection(targetLanguageSelection);
  const effectiveSourceLanguage =
    sourceLanguage === AUTO_DETECT
      ? ocrResult?.detected_language && ocrResult.detected_language !== "unknown"
        ? ocrResult.detected_language
        : preferences.default_source_language
      : sourceLanguage;

  const textToTranslate = (isEditing ? correctedText : correctedText || ocrResult?.extracted_text || "")
    .trim();
  const hasTranslation = Boolean(
    translationResult && translationResult.source !== "unavailable" && translationResult.translated_text,
  );

  const { isPlaying, audioType, statusMessage, play } = useVoicePlayback({
    text: translationResult?.translated_text ?? "",
    language: targetResolved.base_language,
    languageSelection: targetLanguageSelection,
    dialect: targetResolved.dialect_variant,
    pronunciationSimple: translationResult?.pronunciation_simple,
    disabled: !hasTranslation,
  });

  const playRef = useRef(play);
  playRef.current = play;

  useEffect(() => {
    setTargetLanguageSelection(preferences.default_target_language);
  }, [preferences]);

  useEffect(() => {
    setIsOnline(isBrowserOnline());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopVoicePlayback();
      revokeObjectUrl(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (autoplayRequestId === 0 || !hasTranslation) return;
    void playRef.current("normal").then((result) => {
      if (result.autoplayBlocked) setAutoplayBlocked(true);
    });
  }, [autoplayRequestId, hasTranslation]);

  const clearImage = useCallback(() => {
    revokeObjectUrl(previewUrl);
    setPreviewUrl(null);
    setImageBase64(null);
    setImageMimeType(null);
    setOcrResult(null);
    setCorrectedText("");
    setTranslationResult(null);
    setQualityMessages([]);
    setDocResult(null);
    setObjectHint(null);
  }, [previewUrl]);

  async function handleImageSelected(file: File) {
    setFormError(null);
    setInfoMessage(null);
    setTranslationResult(null);
    setOcrResult(null);
    setCorrectedText("");
    setDocResult(null);

    try {
      const prepared = await prepareOcrImageFile(file);
      revokeObjectUrl(previewUrl);
      const mime =
        prepared.mimeType === "image/jpg" ? "image/jpeg" : prepared.mimeType;
      setPreviewUrl(prepared.previewUrl);
      setImageBase64(prepared.base64);
      setImageMimeType(mime);
      const quality = await assessOcrImageQuality(prepared.previewUrl, mime);
      setQualityMessages(
        quality
          .filter((item) => item.code !== "ok")
          .map((item) => `${item.message} ${item.guidance}`.trim()),
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not load image.");
    }
  }

  async function handleRotate() {
    if (!previewUrl || !imageMimeType) return;
    try {
      const next = await rotateOcrImage(previewUrl, imageMimeType, 90);
      revokeObjectUrl(previewUrl);
      setPreviewUrl(next.previewUrl);
      setImageBase64(next.base64);
      setImageMimeType(next.mimeType);
      setInfoMessage("Rotated image. Extract again.");
    } catch {
      setFormError("Could not rotate image.");
    }
  }

  async function handleEnhance() {
    if (!previewUrl || !imageMimeType) return;
    try {
      const next = await enhanceOcrContrast(previewUrl, imageMimeType);
      revokeObjectUrl(previewUrl);
      setPreviewUrl(next.previewUrl);
      setImageBase64(next.base64);
      setImageMimeType(next.mimeType);
      setInfoMessage("Enhanced contrast. Extract again.");
      setQualityMessages((prev) =>
        prev.filter((message) => !message.toLowerCase().includes("contrast")),
      );
    } catch {
      setFormError("Could not enhance image.");
    }
  }

  async function handleExtract() {
    if (!imageBase64 || !imageMimeType) {
      setFormError("Select or capture an image first.");
      return;
    }

    setIsExtracting(true);
    setFormError(null);
    setInfoMessage(null);
    setTranslationResult(null);

    try {
      const response = await extractTextFromImageViaClient({
        image_base64: imageBase64,
        image_mime_type: imageMimeType,
        source_language_hint: sourceLanguage,
        target_language: targetLanguageSelection,
        target_variant_label: targetResolved.dialect_label,
        user_context: userContext,
      });

      const orderedText = mergeOcrTextWithBlocks(
        response.extracted_text,
        response.blocks,
      );
      const nextResult = { ...response, extracted_text: orderedText };
      setOcrResult(nextResult);
      setCorrectedText(orderedText);
      setOcrModeLabel(
        response.ocr_mode === "local"
          ? "On-device"
          : response.ocr_mode === "cloud"
            ? "Cloud"
            : "Manual",
      );

      const warnings = response.warnings ?? [];
      const objectWarning = warnings.find((item) =>
        /sign|menu|label|ticket|notice|form|drawing/i.test(item),
      );
      setObjectHint(objectWarning ?? null);

      if (response.source === "unavailable") {
        setIsEditing(true);
        setFormError(
          response.unavailable_reason ??
            "Text extraction unavailable. Type the text manually.",
        );
        return;
      }

      if (
        orderedText.trim().length >= 4 &&
        response.confidence_score >= 0.45 &&
        isBrowserOnline()
      ) {
        await handleTranslate(orderedText);
      }
    } catch (error) {
      setIsEditing(true);
      setFormError(
        error instanceof OcrApiError
          ? "Text extraction is unavailable. Import another image or type the text manually."
          : "Text extraction failed. Type the text manually.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleTranslate(overrideText?: string) {
    const inputText = (overrideText ?? textToTranslate).trim();
    if (!inputText) {
      setFormError("Extract or enter text before translating.");
      return;
    }

    setIsTranslating(true);
    setFormError(null);
    setInfoMessage(null);
    setAutoplayBlocked(false);

    try {
      if (!isBrowserOnline()) {
        const offline = await tryTranslateOcrTextOffline(
          effectiveSourceLanguage,
          targetLanguageSelection,
          inputText,
        );
        if (offline) {
          setTranslationResult(offline);
          setAutoplayRequestId((id) => id + 1);
          saveLensScanHistoryItem({
            sourceLanguage: effectiveSourceLanguage,
            targetLanguage: targetLanguageSelection,
            originalText: inputText,
            translatedText: offline.translated_text,
            userContext,
          });
          return;
        }

        await saveOcrMissingTranslationRequest({
          from_language_id: effectiveSourceLanguage,
          to_language_id: targetLanguageSelection,
          requested_text: inputText,
          user_context: userContext,
        });
        setInfoMessage("Saved for when you are back online.");
        setTranslationResult({
          original_text: inputText,
          translated_text: "",
          source_language: effectiveSourceLanguage,
          target_language: targetResolved.base_language,
          natural_translation: "",
          pronunciation_simple: "",
          confidence_score: 0,
          validation_status: "uncertain",
          source: "unavailable",
          reliability_label: "Offline",
          unavailable_reason: "No offline translation for this text. Saved locally.",
        });
        return;
      }

      const targetFields = buildTranslationTargetPayload(targetLanguageSelection);
      const payload = {
        input_text: inputText,
        source_language: effectiveSourceLanguage,
        ...targetFields,
        user_context: userContext,
        translation_mode: translationMode,
        ai_translation_enabled: preferences.ai_translation_enabled,
        rule_fallback_enabled: preferences.rule_fallback_enabled,
      };
      const parsed = translatorRequestSchema.safeParse(payload);
      if (!parsed.success) {
        setFormError("Check your languages and try again.");
        return;
      }

      const { response } = await translateSentenceViaApi(parsed.data);
      setTranslationResult(response);
      setAutoplayRequestId((id) => id + 1);
      if (response.translated_text) {
        saveLensScanHistoryItem({
          sourceLanguage: effectiveSourceLanguage,
          targetLanguage: targetLanguageSelection,
          originalText: inputText,
          translatedText: response.translated_text,
          objectType: objectHint,
          userContext,
        });
      }
    } catch (error) {
      setFormError(
        error instanceof TranslatorApiError
          ? "Translation is temporarily unavailable. You can keep editing the extracted text."
          : "Could not translate this text.",
      );
    } finally {
      setIsTranslating(false);
    }
  }

  function handleDocumentAction(action: LensDocumentActionId) {
    if (action === "translate_all") {
      void handleTranslate();
      return;
    }
    const result = runLocalDocumentIntelligence(action, textToTranslate);
    setDocResult(result);
    if (action === "define_difficult" && result.items?.[0]) {
      // Keep list visible; user taps items.
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

  const displayStatusMessage = autoplayBlocked
    ? "Tap speak to play audio."
    : statusMessage;
  const isBusy = isExtracting || isTranslating;

  return (
    <div className="space-y-3">
      <CompactCard padding="sm">
        <div className="grid grid-cols-2 gap-2">
          <SearchableLanguageSelectField
            id="camera_source_language"
            label="From"
            value={sourceLanguage}
            onChange={setSourceLanguage}
            leadingOptions={[{ value: AUTO_DETECT, label: "Auto" }]}
          />
          <SearchableLanguageSelectField
            id="camera_target_language"
            label="To"
            value={targetLanguageSelection}
            onChange={setTargetLanguageSelection}
          />
        </div>
        {!isOnline && (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">Offline — packs only</p>
        )}
      </CompactCard>

      <ImageCaptureCard
        previewUrl={previewUrl}
        isBusy={isBusy}
        onImageSelected={handleImageSelected}
        onClear={clearImage}
        preferCamera={preferCamera}
        preferImport={preferImport}
      />

      {previewUrl && (
        <LensImageTools
          disabled={isBusy}
          onRotate={() => void handleRotate()}
          onEnhance={() => void handleEnhance()}
          qualityMessages={qualityMessages}
        />
      )}

      <OcrResultEditor
        extractedText={ocrResult?.extracted_text ?? ""}
        correctedText={correctedText}
        confidenceScore={ocrResult?.confidence_score ?? 0}
        ocrSource={ocrResult?.source ?? null}
        ocrModeLabel={ocrModeLabel}
        isEditing={isEditing || !ocrResult?.extracted_text}
        isBusy={isBusy}
        languageHint={effectiveSourceLanguage}
        userContext={userContext}
        showDeveloperDetails={developerModeActive}
        onCorrectedTextChange={setCorrectedText}
        onToggleEdit={() => setIsEditing((value) => !value)}
        onExtract={() => void handleExtract()}
        onTranslate={() => void handleTranslate()}
        canTranslate={textToTranslate.length > 0}
        onTapWord={(word) => setDefineWord(word)}
      />

      {textToTranslate.length > 0 && (
        <DocumentIntelligenceActions
          disabled={isBusy}
          result={docResult}
          onAction={handleDocumentAction}
          onDefineWord={(word) => setDefineWord(word)}
        />
      )}

      {objectHint && (
        <CompactAlert variant="info">
          Detected context hint: {objectHint}
        </CompactAlert>
      )}

      {formError && <CompactAlert variant="error">{formError}</CompactAlert>}
      {infoMessage && <CompactAlert variant="info">{infoMessage}</CompactAlert>}

      {isBusy && (
        <LoadingState
          title={isExtracting ? "Scanning" : "Translating"}
          label={isExtracting ? "Reading text…" : "Translating…"}
        />
      )}

      {translationResult && !isBusy && (
        <>
          <CameraTranslationResultCard
            result={translationResult}
            audioType={audioType}
            isPlaying={isPlaying}
            statusMessage={displayStatusMessage}
            onPlay={replayAudio}
            onRepeatSlowly={repeatSlowly}
          />
          <CompactAlert variant="warning">{LENS_SAFETY_DISCLAIMER}</CompactAlert>
        </>
      )}

      <TapToDefineSheet
        open={Boolean(defineWord)}
        word={defineWord ?? ""}
        sourceLanguage={effectiveSourceLanguage}
        targetLanguage={targetLanguageSelection}
        userContext={userContext}
        onClose={() => setDefineWord(null)}
      />
    </div>
  );
}
